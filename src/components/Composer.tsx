import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  Paperclip, 
  Mic, 
  MicOff, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  X, 
  Square, 
  FileText, 
  BarChart3, 
  ChevronDown,
  Code2,
  Zap,
  BookOpen,
  Feather,
  AlertCircle,
  Radio,
  Check
} from 'lucide-react';
import { Attachment, ExecutionMode, UserPreferences } from '../types';
import { formatFileSize } from '../lib/utils';
import { CHAT_ROLES, AVAILABLE_MODELS, getRoleById } from '../lib/ai/roles';

interface ComposerProps {
  onSendMessage: (content: string, attachments: Attachment[], mode: ExecutionMode, model?: string, roleId?: string) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  isOnline: boolean;
  onOpenLiveVoice?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  preferences,
  onUpdatePreferences,
  isOnline,
  onOpenLiveVoice,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');

  const activeRole = getRoleById(preferences.activeRoleId);
  const currentModelId = preferences.preferredModel || 'gemini-3.5-flash';
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === currentModelId) || AVAILABLE_MODELS[0];

  // Auto-resize textarea height smoothly (min single-line ~24px up to 180px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '24px';
      const scrollHeight = textarea.scrollHeight;
      if (input.trim().length === 0) {
        textarea.style.height = '24px';
      } else {
        textarea.style.height = `${Math.min(Math.max(scrollHeight, 24), 190)}px`;
      }
    }
  }, [input]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Stop speech recognition helper
  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Toggle Web Speech API voice-to-text recognition
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    if (isRecording) {
      stopSpeechRecognition();
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

      baseTextRef.current = input;
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinal = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            currentFinal += (currentFinal && !currentFinal.endsWith(' ') ? ' ' : '') + transcriptChunk.trim();
            finalTranscriptRef.current = currentFinal;
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + transcriptChunk.trim();
          }
        }

        const spokenParts = [currentFinal, interimTranscript].filter(Boolean).join(' ');
        const prefix = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
        const combined = prefix + spokenParts;

        setInput(combined);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          return;
        } else if (event.error === 'network') {
          setSpeechError('Network error encountered during speech recognition.');
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}`);
        }
        stopSpeechRecognition();
        setTimeout(() => setSpeechError(null), 6000);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError(err?.message || 'Failed to start speech recognition.');
      setIsRecording(false);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Handle file uploads
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isDataset = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.json');

      const reader = new FileReader();

      const attachmentPromise = new Promise<Attachment>((resolve) => {
        if (isImage) {
          reader.onload = () => {
            resolve({
              id: 'att_' + Date.now() + '_' + i,
              name: file.name,
              type: 'image',
              mimeType: file.type || 'image/png',
              size: file.size,
              dataBase64: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        } else {
          reader.onload = () => {
            const textContent = reader.result as string;
            resolve({
              id: 'att_' + Date.now() + '_' + i,
              name: file.name,
              type: isDataset ? 'dataset' : 'document',
              mimeType: file.type || 'text/plain',
              size: file.size,
              extractedText: textContent,
            });
          };
          reader.readAsText(file);
        }
      });

      const att = await attachmentPromise;
      newAttachments.push(att);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    if (isRecording) {
      stopSpeechRecognition();
    }

    onSendMessage(
      input.trim(), 
      attachments, 
      preferences.executionMode,
      preferences.preferredModel || activeRole.recommendedModel,
      activeRole.id
    );
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 className="w-3 h-3 text-purple-400" />;
      case 'BarChart3': return <BarChart3 className="w-3 h-3 text-emerald-400" />;
      case 'Zap': return <Zap className="w-3 h-3 text-amber-400" />;
      case 'BookOpen': return <BookOpen className="w-3 h-3 text-blue-400" />;
      case 'Feather': return <Feather className="w-3 h-3 text-rose-400" />;
      default: return <Sparkles className="w-3 h-3 text-indigo-400" />;
    }
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 select-none relative z-20">
      {/* Speech Recognition Error Notice */}
      {speechError && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs backdrop-blur-md animate-fade-in shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span className="flex-1 text-[11px] sm:text-xs">{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="p-0.5 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 rounded text-rose-600 dark:text-rose-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Live Voice Dictation Active Wave Status (Compact Bar) */}
      {isRecording && (
        <div className="flex items-center justify-between gap-2 mb-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-500/40 text-xs backdrop-blur-md shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              Voice Input Active
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] hidden sm:inline">
              (Listening... speak to dictate)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 h-2.5 px-1">
              <span className="w-0.5 bg-rose-500 rounded-full h-1.5 animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-rose-500 rounded-full h-3 animate-[pulse_0.4s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-rose-500 rounded-full h-2 animate-[pulse_0.7s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-rose-500 rounded-full h-3.5 animate-[pulse_0.5s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-rose-500 rounded-full h-1.5 animate-[pulse_0.8s_ease-in-out_infinite]" />
            </div>
            <button
              onClick={stopSpeechRecognition}
              className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <MicOff className="w-2.5 h-2.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 p-1.5 rounded-2xl bg-white/70 dark:bg-[#15151C]/70 border border-slate-200/70 dark:border-white/[0.08] backdrop-blur-md">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-xl bg-slate-100 dark:bg-[#202028] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-200 shadow-2xs"
            >
              {att.type === 'image' && att.dataBase64 ? (
                <img src={att.dataBase64} alt={att.name} className="w-4 h-4 object-cover rounded" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="truncate max-w-[100px] text-[11px] font-medium">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Compact ChatGPT-Style Floating Glass Composer Card */}
      <div 
        className={`glass-composer relative rounded-[24px] sm:rounded-[28px] p-2 sm:p-2.5 transition-all duration-200 ${
          isRecording 
            ? 'border-rose-500/60 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10' 
            : 'focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:shadow-xl focus-within:shadow-indigo-500/5'
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.txt,.csv,.json,.xlsx,.docx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Top Floating Pill Selectors Toolbar inside Composer */}
        <div className="flex items-center justify-between gap-1.5 px-1.5 pb-1.5 border-b border-slate-100/80 dark:border-white/[0.05] text-xs">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Persona / Role Selector Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowModelDropdown(false);
                  setShowModeDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-white/[0.1] hover:border-indigo-500/40 transition-colors"
                title="Change active chatbot role & persona"
              >
                {getRoleIcon(activeRole.iconName)}
                <span className="font-semibold text-slate-800 dark:text-slate-100 max-w-[100px] sm:max-w-[140px] truncate">
                  {activeRole.name}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 opacity-70" />
              </button>

              {/* Role Dropdown */}
              {showRoleDropdown && (
                <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-1.5 rounded-2xl bg-white/95 dark:bg-[#16161D]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-2xl text-xs z-40 space-y-1 animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06]">
                    Chatbot Role & System Instruction
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {CHAT_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          onUpdatePreferences({ 
                            activeRoleId: role.id,
                            preferredModel: role.recommendedModel 
                          });
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2 p-2 rounded-xl text-left transition-all ${
                          activeRole.id === role.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/50'
                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{getRoleIcon(role.iconName)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{role.name}</span>
                            {activeRole.id === role.id && <Check className="w-3 h-3 text-indigo-500 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {role.tagline || role.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Model Selector Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowModelDropdown(!showModelDropdown);
                  setShowRoleDropdown(false);
                  setShowModeDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-white/[0.1] hover:border-indigo-500/40 transition-colors"
                title="Change active Gemini model"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {currentModel.name}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 opacity-70" />
              </button>

              {/* Model Dropdown */}
              {showModelDropdown && (
                <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-72 p-1.5 rounded-2xl bg-white/95 dark:bg-[#16161D]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-2xl text-xs z-40 space-y-1 animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06]">
                    Gemini Model Hierarchy
                  </div>
                  <div className="space-y-1">
                    {AVAILABLE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onUpdatePreferences({ preferredModel: m.id });
                          setShowModelDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2 p-2 rounded-xl text-left transition-all ${
                          currentModelId === m.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/50'
                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">{m.name}</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${m.badgeColor}`}>
                              {m.tier}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Execution Mode Selector Pill */}
            <div className="relative hidden xs:block">
              <button
                onClick={() => {
                  setShowModeDropdown(!showModeDropdown);
                  setShowRoleDropdown(false);
                  setShowModelDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/[0.1] hover:border-indigo-500/40 transition-colors"
                title="Execution Security & Routing Mode"
              >
                {preferences.executionMode === 'hybrid' && <Sparkles className="w-2.5 h-2.5 text-indigo-400" />}
                {preferences.executionMode === 'local-only' && <Cpu className="w-2.5 h-2.5 text-emerald-500" />}
                {preferences.executionMode === 'private-offline' && <ShieldCheck className="w-2.5 h-2.5 text-amber-500" />}
                <span>{preferences.executionMode.replace('-', ' ')}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {/* Mode Dropdown */}
              {showModeDropdown && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-1.5 rounded-2xl bg-white/95 dark:bg-[#16161D]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-2xl text-xs z-40 space-y-1 animate-fade-in">
                  <button
                    onClick={() => {
                      onUpdatePreferences({ executionMode: 'hybrid' });
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-xl text-left ${
                      preferences.executionMode === 'hybrid'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Hybrid Cloud Gemini</div>
                      <div className="text-[10px] text-slate-400">Gemini 3.1 Pro / 3.5 Flash / 3.1 Flash Lite</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdatePreferences({ executionMode: 'local-only' });
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-xl text-left ${
                      preferences.executionMode === 'local-only'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Local AI Only</div>
                      <div className="text-[10px] text-slate-400">Deterministic local engine execution</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdatePreferences({ executionMode: 'private-offline' });
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-xl text-left ${
                      preferences.executionMode === 'private-offline'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Private Air-Gapped</div>
                      <div className="text-[10px] text-slate-400">Zero network sandbox</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:inline font-mono">
            ↵ to send · ⇧↵ newline
          </span>
        </div>

        {/* Horizontal Input Row: [ Attachment ] [ Textarea ] [ Mic ] [ Send/Stop ] */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-1 pt-1">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors shrink-0 active:scale-95"
            title="Attach files, datasets, or images"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Centered Auto-Expanding Textarea */}
          <div className="flex-1 min-w-0 flex items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? 'Listening... Voice will appear in real-time...'
                  : `Message ${activeRole.name}...`
              }
              rows={1}
              className="w-full py-1 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none leading-relaxed transition-[height] duration-75 block"
              style={{ minHeight: '24px', maxHeight: '190px' }}
            />
          </div>

          {/* Real-time Voice Call (Gemini 3.1 Flash Live) */}
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0 active:scale-95"
              title="Real-time Voice Conversation (Gemini 3.1 Flash Live)"
              aria-label="Start Live Voice Call"
            >
              <Radio className="w-4 h-4" />
            </button>
          )}

          {/* Voice Input (Web Speech API) Mic Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`p-2 rounded-full transition-all shrink-0 active:scale-95 ${
              isRecording
                ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/40 ring-2 ring-rose-400/40'
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.08]'
            }`}
            title={isRecording ? 'Stop voice recording' : 'Voice-to-text input (Web Speech API)'}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send / Stop Streaming Action Button */}
          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="p-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 shrink-0"
              title="Stop streaming response"
              aria-label="Stop response"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasContent}
              className={`p-2 rounded-full font-medium transition-all active:scale-95 shrink-0 ${
                hasContent
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-200/80 dark:bg-white/[0.06] text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


