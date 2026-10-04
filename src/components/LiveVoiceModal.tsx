import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Radio, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Video, 
  VideoOff, 
  Settings2, 
  Send, 
  Square, 
  PhoneOff, 
  Save, 
  AlertCircle,
  Cpu,
  Layers,
  ChevronDown,
  MessageSquare,
  Zap,
  Activity
} from 'lucide-react';
import { LiveAudioManager, LiveTranscriptItem, LiveSessionStatus } from '../lib/ai/liveAudio';
import { UserPreferences } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToChat?: (transcripts: LiveTranscriptItem[]) => void;
  preferences: UserPreferences;
}

const AVAILABLE_VOICES = [
  { id: 'Zephyr', name: 'Zephyr', style: 'Natural, Warm & Conversational', tone: 'Balanced' },
  { id: 'Puck', name: 'Puck', style: 'Energetic, Crisp & Direct', tone: 'Upbeat' },
  { id: 'Charon', name: 'Charon', style: 'Deep, Resonant & Authoritative', tone: 'Executive' },
  { id: 'Kore', name: 'Kore', style: 'Calm, Precise & Analytical', tone: 'Thoughtful' },
  { id: 'Fenrir', name: 'Fenrir', style: 'Dynamic, Bold & Articulate', tone: 'Engaging' },
  { id: 'Aoede', name: 'Aoede', style: 'Melodic, Friendly & Empathetic', tone: 'Expressive' },
];

const VOICE_PERSONAS = [
  {
    id: 'conversational',
    name: 'Conversational Companion',
    instruction: 'You are Nexora Voice, an intelligent, friendly conversational partner. Keep your responses concise, natural, and expressive for spoken dialogue.',
  },
  {
    id: 'architect',
    name: 'Senior Tech Architect',
    instruction: 'You are a pragmatic, high-level software architect. Discuss engineering trade-offs, system designs, algorithms, and code structures clearly and directly.',
  },
  {
    id: 'executive',
    name: 'Executive Strategist',
    instruction: 'You are an executive advisor and strategic coach. Provide razor-sharp business insights, prioritization frameworks, and crisp decisions.',
  },
  {
    id: 'creative',
    name: 'Creative Brainstormer',
    instruction: 'You are an imaginative creative collaborator. Explore innovative product concepts, evocative storytelling, and novel angles.',
  },
];

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveToChat,
  preferences,
}) => {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [selectedPersona, setSelectedPersona] = useState<string>('conversational');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const managerRef = useRef<LiveAudioManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Session duration timer
  useEffect(() => {
    let interval: any = null;
    if (isOpen && (status === 'connected' || status === 'listening' || status === 'speaking')) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, status, sessionStartTime]);

  // Initialize and connect when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (managerRef.current) {
        managerRef.current.disconnect();
        managerRef.current = null;
      }
      setStatus('idle');
      setTranscripts([]);
      setErrorMessage(null);
      setIsCameraActive(false);
      return;
    }

    setSessionStartTime(Date.now());
    setElapsedSeconds(0);
    setErrorMessage(null);

    const persona = VOICE_PERSONAS.find((p) => p.id === selectedPersona);
    const systemInstruction = persona?.instruction || '';

    const manager = new LiveAudioManager();
    managerRef.current = manager;

    manager.onStatusChange = (newStatus, msg) => {
      setStatus(newStatus);
      if (msg) setStatusMessage(msg);
    };

    manager.onTranscript = (item) => {
      setTranscripts((prev) => {
        // If last item is from the same role and recent, append or add
        const last = prev[prev.length - 1];
        if (last && last.role === item.role && Date.now() - last.timestamp < 3000) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: (last.text + ' ' + item.text).trim(), timestamp: Date.now() },
          ];
        }
        return [...prev, item];
      });
    };

    manager.onAudioLevels = (inLevel, outLevel) => {
      setInputLevel(inLevel);
      setOutputLevel(outLevel);
    };

    manager.onError = (err) => {
      setErrorMessage(err);
    };

    manager.connect({
      voice: selectedVoice,
      systemInstruction,
    });

    return () => {
      manager.disconnect();
      managerRef.current = null;
    };
  }, [isOpen]);

  // Canvas visualizer animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Base radius modulation
      const activeLevel = Math.max(inputLevel * 1.5, outputLevel * 2.0);
      const baseRadius = 60 + activeLevel * 50;

      // Glow color palette based on state
      let glowColor = 'rgba(99, 102, 241, 0.4)'; // Indigo
      let ringColor = '#6366f1';

      if (status === 'speaking') {
        glowColor = 'rgba(168, 85, 247, 0.6)'; // Purple/Magenta
        ringColor = '#a855f7';
      } else if (status === 'listening' && inputLevel > 0.05) {
        glowColor = 'rgba(16, 185, 129, 0.6)'; // Emerald
        ringColor = '#10b981';
      } else if (status === 'connecting') {
        glowColor = 'rgba(59, 130, 246, 0.4)'; // Blue
        ringColor = '#3b82f6';
      }

      // Outer radial glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 1.8
      );
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(0.7, glowColor.replace('0.6', '0.2').replace('0.4', '0.1'));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Fluid sinusoidal harmonic rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        ctx.beginPath();
        const rOffset = (r * Math.PI) / 3;
        const currentR = baseRadius + r * 12 * (activeLevel + 0.3);

        for (let a = 0; a <= Math.PI * 2; a += 0.05) {
          const distortion = Math.sin(a * 5 + phase + rOffset) * (8 + activeLevel * 25);
          const x = centerX + (currentR + distortion) * Math.cos(a);
          const y = centerY + (currentR + distortion) * Math.sin(a);
          if (a === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2.5 - r * 0.6;
        ctx.globalAlpha = 0.8 - r * 0.25;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Inner Core Orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, 32 + activeLevel * 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, status, inputLevel, outputLevel]);

  // Handle Voice Change
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (managerRef.current) {
      managerRef.current.switchVoice(voiceId);
    }
  };

  // Handle Camera Toggle
  const handleToggleCamera = async () => {
    if (!managerRef.current) return;
    const nextState = !isCameraActive;
    setIsCameraActive(nextState);
    await managerRef.current.enableCamera(nextState);

    if (nextState && videoPreviewRef.current) {
      const stream = managerRef.current.getVideoStream();
      if (stream) {
        videoPreviewRef.current.srcObject = stream;
      }
    }
  };

  // Handle Send Text
  const handleSendText = () => {
    if (!textInput.trim() || !managerRef.current) return;
    managerRef.current.sendText(textInput);
    setTextInput('');
  };

  // Stop / Interrupt playback
  const handleInterrupt = () => {
    if (managerRef.current) {
      managerRef.current.stopAudioPlayback();
    }
  };

  // Save to chat and close
  const handleSaveAndClose = () => {
    if (transcripts.length > 0 && onSaveToChat) {
      onSaveToChat(transcripts);
    }
    onClose();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] max-h-[850px] bg-[#0E0E14] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="h-14 px-4 sm:px-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">Nexora Live Voice</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold tracking-wider font-mono">
                  gemini-3.1-flash-live-preview
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                24kHz Gapless PCM Audio · Real-time bidirectional streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Session Timer */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-colors ${
                showSettings ? 'bg-indigo-600 text-white' : 'hover:bg-white/[0.08] text-slate-400 hover:text-white'
              }`}
              title="Voice & Persona Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveAndClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Close Voice Session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Drawer (Dropdown) */}
        {showSettings && (
          <div className="px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#14141E] grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-xs z-30 shrink-0">
            {/* Voice Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Gemini Live Voice Profile
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {AVAILABLE_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedVoice === v.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{v.name}</span>
                      <span className="text-[9px] text-indigo-400">{v.tone}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{v.style}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Preset */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Conversation Persona Preset
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {VOICE_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedPersona === p.id
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-xs'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.instruction}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content Area: Split Visualizer & Live Transcript */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* Left: Fluid Orb & Multimodal Preview Canvas (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-white/[0.08] relative bg-radial-at-c from-indigo-950/20 to-transparent">
            {/* Visualizer Canvas */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={360}
                height={360}
                className="w-full h-full object-contain"
              />

              {/* Status Badge Centered under orb */}
              <div className="absolute -bottom-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161622]/90 border border-white/10 shadow-lg text-xs font-semibold backdrop-blur-md">
                {status === 'speaking' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-purple-300">Gemini is Speaking</span>
                  </>
                )}
                {status === 'listening' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-300">Listening to Voice...</span>
                  </>
                )}
                {status === 'connecting' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300">Connecting Live API...</span>
                  </>
                )}
                {status === 'connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-indigo-300">Live Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Multimodal Camera Mini Preview if Active */}
            {isCameraActive && (
              <div className="mt-6 w-full max-w-[240px] rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-lg relative aspect-video">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VISION STREAM
                </div>
              </div>
            )}

            {/* Audio Telemetry Info */}
            <div className="mt-6 flex items-center gap-4 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span>MIC INPUT:</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.min(inputLevel * 250, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span>AI VOICE:</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-75"
                    style={{ width: `${Math.min(outputLevel * 250, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Transcript Scrollable View (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-[#0A0A0E]/50">
            <div className="p-3 px-4 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400 bg-white/[0.01]">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-300">Live Captions & Transcripts</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {transcripts.length} turns recorded
              </span>
            </div>

            {/* Transcript Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Radio className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                  <p className="text-xs font-medium text-slate-400">Voice Session Active</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Start speaking naturally into your microphone. Gemini 3.1 Flash Live will converse in real-time with sub-second response latency.
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      <span>{t.role === 'user' ? 'You' : `Nexora (${selectedVoice})`}</span>
                    </div>
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        t.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                          : 'bg-[#181822] text-slate-200 border border-white/[0.08] rounded-bl-xs shadow-sm'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Text Input for Hybrid Interaction */}
            <div className="p-3 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                  placeholder="Type a message or question while in voice mode..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
                <button
                  onClick={handleSendText}
                  disabled={!textInput.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Global Controls Footer */}
        <div className="h-16 px-4 sm:px-6 border-t border-white/[0.08] bg-[#12121A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Camera Vision Toggle */}
            <button
              onClick={handleToggleCamera}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isCameraActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
              }`}
              title="Toggle Webcam / Camera Vision"
            >
              {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">{isCameraActive ? 'Vision On' : 'Enable Camera'}</span>
            </button>

            {/* Interrupt Response Button */}
            {status === 'speaking' && (
              <button
                onClick={handleInterrupt}
                className="p-2.5 rounded-xl bg-amber-600/30 border border-amber-500 text-amber-300 hover:bg-amber-600/50 transition-all flex items-center gap-1.5 text-xs font-semibold animate-pulse"
                title="Interrupt AI speaking"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Interrupt</span>
              </button>
            )}
          </div>

          {/* End Call & Save Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveAndClose}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save to Chat</span>
            </button>

            <button
              onClick={() => {
                if (managerRef.current) {
                  managerRef.current.disconnect();
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
