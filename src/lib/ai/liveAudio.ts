/**
 * Nexora Live Audio & WebSocket Client Manager
 * Connects to Gemini 3.1 Flash Live (gemini-3.1-flash-live-preview)
 * Handles 16kHz PCM audio capture, 24kHz gapless playback, interruption, and live transcription.
 */

export interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isFinal?: boolean;
}

export type LiveSessionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error'
  | 'closed';

export interface LiveVoiceConfig {
  voice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | string;
  systemInstruction?: string;
  enableCamera?: boolean;
  enableScreen?: boolean;
}

export class LiveAudioManager {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private status: LiveSessionStatus = 'idle';
  private pingInterval: any = null;
  private animFrameId: any = null;

  // Video / Screen stream
  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private videoCanvas: HTMLCanvasElement | null = null;
  private videoInterval: any = null;

  // Callbacks
  public onStatusChange?: (status: LiveSessionStatus, message?: string) => void;
  public onTranscript?: (transcript: LiveTranscriptItem) => void;
  public onAudioLevels?: (inputLevel: number, outputLevel: number) => void;
  public onError?: (error: string) => void;

  private currentVoice: string = 'Zephyr';
  private currentInstruction: string = '';

  constructor() {
    // Initialized in disconnected state
  }

  public getStatus(): LiveSessionStatus {
    return this.status;
  }

  private setStatus(newStatus: LiveSessionStatus, message?: string) {
    this.status = newStatus;
    this.onStatusChange?.(newStatus, message);
  }

  /**
   * Connect to Gemini Live API WebSocket endpoint
   */
  public async connect(config: LiveVoiceConfig = { voice: 'Zephyr' }) {
    this.currentVoice = config.voice;
    this.currentInstruction = config.systemInstruction || '';

    try {
      this.setStatus('connecting', 'Connecting to Gemini Live API...');

      // Build WebSocket URL based on current origin
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const params = new URLSearchParams();
      params.set('voice', config.voice);
      if (config.systemInstruction) {
        params.set('instruction', config.systemInstruction);
      }

      const wsUrl = `${protocol}//${host}/api/live?${params.toString()}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        // Start ping interval
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);

        // Start local audio capture pipeline
        await this.startAudioCapture();
        this.initAudioPlayback();
        this.startLevelMonitoring();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[LiveAudio] Failed to parse message', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[LiveAudio] WebSocket error', err);
        this.setStatus('error', 'Connection error with Live API');
        this.onError?.('WebSocket connection error');
      };

      this.ws.onclose = (event) => {
        this.cleanup();
        this.setStatus('closed', 'Session closed');
      };
    } catch (err: any) {
      this.cleanup();
      this.setStatus('error', err.message || 'Failed to start Live session');
      this.onError?.(err.message || 'Failed to start Live session');
    }
  }

  /**
   * Handle messages received from the Gemini Live Server bridge
   */
  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'connected':
        this.setStatus('connected', `Live session connected (${data.voice || this.currentVoice})`);
        break;

      case 'status':
        if (data.status === 'unauthenticated') {
          this.setStatus('error', data.message);
          this.onError?.(data.message);
        }
        break;

      case 'audio':
        if (data.data) {
          this.playAudioChunk(data.data);
          if (this.status !== 'speaking') {
            this.setStatus('speaking', 'Gemini is speaking...');
          }
        }
        break;

      case 'transcript':
        if (data.text) {
          this.onTranscript?.({
            id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            role: data.role || 'model',
            text: data.text,
            timestamp: Date.now(),
            isFinal: true,
          });
        }
        break;

      case 'interrupted':
        // User interrupted the model -> Stop playback instantly
        this.stopAudioPlayback();
        this.setStatus('listening', 'Listening...');
        break;

      case 'turnComplete':
        if (this.status === 'speaking') {
          this.setStatus('listening', 'Listening...');
        }
        break;

      case 'error':
        this.setStatus('error', data.error);
        this.onError?.(data.error);
        break;
    }
  }

  /**
   * Initialize microphone capture and resample audio to 16kHz PCM (mono)
   */
  private async startAudioCapture() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioContextClass();

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      const nativeSampleRate = this.inputAudioCtx.sampleRate;
      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);

      // Analyzer for microphone visualizer
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.5;
      this.micSource.connect(this.inputAnalyser);

      // Script processor for capturing PCM audio chunks
      // Buffer size: 4096 samples
      this.processorNode = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Resample inputChannelData to 16,000 Hz if needed
        const resampledData = this.resampleAudio(inputChannelData, nativeSampleRate, 16000);

        // Convert Float32Array to 16-bit PCM little endian base64
        const pcmBase64 = this.float32ToPcmBase64(resampledData);

        if (pcmBase64) {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              audio: pcmBase64,
              mimeType: 'audio/pcm;rate=16000',
            })
          );
        }
      };

      this.micSource.connect(this.processorNode);
      this.processorNode.connect(this.inputAudioCtx.destination);
    } catch (err: any) {
      console.error('[LiveAudio] Error accessing microphone', err);
      throw new Error('Microphone access denied or unavailable: ' + (err.message || ''));
    }
  }

  /**
   * Resample Float32 audio array from source sample rate to target sample rate (linear interpolation)
   */
  private resampleAudio(source: Float32Array, sourceRate: number, targetRate: number): Float32Array {
    if (sourceRate === targetRate) return source;

    const ratio = sourceRate / targetRate;
    const newLength = Math.round(source.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originIndex = i * ratio;
      const indexPrev = Math.floor(originIndex);
      const indexNext = Math.min(indexPrev + 1, source.length - 1);
      const frac = originIndex - indexPrev;
      result[i] = source[indexPrev] * (1 - frac) + source[indexNext] * frac;
    }

    return result;
  }

  /**
   * Convert Float32Array [-1.0, 1.0] to base64-encoded 16-bit PCM (little endian)
   */
  private float32ToPcmBase64(float32: Float32Array): string {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Initialize 24kHz AudioContext for high-fidelity Live API audio playback
   */
  private initAudioPlayback() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    } catch {
      this.outputAudioCtx = new AudioContextClass();
    }

    this.outputAnalyser = this.outputAudioCtx.createAnalyser();
    this.outputAnalyser.fftSize = 256;
    this.outputAnalyser.smoothingTimeConstant = 0.4;
    this.outputAnalyser.connect(this.outputAudioCtx.destination);

    this.nextPlayTime = this.outputAudioCtx.currentTime;
  }

  /**
   * Schedule gapless PCM 24kHz playback chunk received from Gemini
   */
  private playAudioChunk(base64Data: string) {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }

    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const buffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAnalyser);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.error('[LiveAudio] Error decoding audio chunk', err);
    }
  }

  /**
   * Immediately stop and cancel all queued audio playback on interruption
   */
  public stopAudioPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
  }

  /**
   * Monitor real-time input and output RMS volume for UI visualizer waves
   */
  private startLevelMonitoring() {
    const inputData = new Uint8Array(128);
    const outputData = new Uint8Array(128);

    const updateLevels = () => {
      let inputLevel = 0;
      let outputLevel = 0;

      if (this.inputAnalyser) {
        this.inputAnalyser.getByteFrequencyData(inputData);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i];
        }
        inputLevel = sum / (inputData.length * 255);
      }

      if (this.outputAnalyser && this.activeSources.length > 0) {
        this.outputAnalyser.getByteFrequencyData(outputData);
        let sum = 0;
        for (let i = 0; i < outputData.length; i++) {
          sum += outputData[i];
        }
        outputLevel = sum / (outputData.length * 255);
      }

      this.onAudioLevels?.(inputLevel, outputLevel);
      this.animFrameId = requestAnimationFrame(updateLevels);
    };

    this.animFrameId = requestAnimationFrame(updateLevels);
  }

  /**
   * Send a text message turn into the live session
   */
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && text.trim()) {
      this.ws.send(JSON.stringify({ type: 'text', text: text.trim() }));
      this.onTranscript?.({
        id: 'user_text_' + Date.now(),
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
        isFinal: true,
      });
    }
  }

  /**
   * Enable webcam video feed streaming (1 frame per second) into Gemini Live API
   */
  public async enableCamera(enable: boolean = true) {
    if (!enable) {
      if (this.videoInterval) {
        clearInterval(this.videoInterval);
        this.videoInterval = null;
      }
      if (this.videoStream) {
        this.videoStream.getTracks().forEach((t) => t.stop());
        this.videoStream = null;
      }
      return;
    }

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 5 } },
      });

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
      }
      this.videoElement.srcObject = this.videoStream;
      await this.videoElement.play();

      if (!this.videoCanvas) {
        this.videoCanvas = document.createElement('canvas');
        this.videoCanvas.width = 480;
        this.videoCanvas.height = 360;
      }

      const ctx = this.videoCanvas.getContext('2d');

      // Send 1 frame every 1000ms
      this.videoInterval = setInterval(() => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !ctx || !this.videoElement) return;

        ctx.drawImage(this.videoElement, 0, 0, this.videoCanvas!.width, this.videoCanvas!.height);
        const jpegBase64 = this.videoCanvas!.toDataURL('image/jpeg', 0.6);

        this.ws.send(
          JSON.stringify({
            type: 'image',
            image: jpegBase64,
            mimeType: 'image/jpeg',
          })
        );
      }, 1000);
    } catch (err: any) {
      console.error('[LiveAudio] Failed to enable camera', err);
      this.onError?.('Camera access failed: ' + (err.message || ''));
    }
  }

  /**
   * Get active video stream for preview
   */
  public getVideoStream(): MediaStream | null {
    return this.videoStream;
  }

  /**
   * Switch live voice
   */
  public switchVoice(voice: string) {
    this.currentVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'configure',
          voice,
          instruction: this.currentInstruction,
        })
      );
    }
  }

  /**
   * Disconnect and clean up resources
   */
  public disconnect() {
    this.cleanup();
    this.setStatus('idle', 'Disconnected');
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    this.stopAudioPlayback();

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
