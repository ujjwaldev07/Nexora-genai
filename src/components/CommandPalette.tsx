import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  BarChart3, 
  FileText, 
  Image as ImageIcon, 
  Activity, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  Sparkles, 
  FolderTree, 
  FileSpreadsheet,
  Radio,
  X 
} from 'lucide-react';
import { Conversation, DocumentFile } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onOpenLiveVoice?: () => void;
  onOpenDataStudio: () => void;
  onOpenImageStudio: () => void;
  onOpenFiles: () => void;
  onOpenProjects: () => void;
  onOpenDiagnostics: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  conversations: Conversation[];
  files: DocumentFile[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  onOpenLiveVoice,
  onOpenDataStudio,
  onOpenImageStudio,
  onOpenFiles,
  onOpenProjects,
  onOpenDiagnostics,
  onOpenSettings,
  onToggleTheme,
  conversations,
  files,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const executeAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#111111] shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-[#222222]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search conversations, files..."
            autoFocus
            className="w-full px-3 py-3 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <div className="space-y-0.5 mt-1">
              {onOpenLiveVoice && (
                <button
                  onClick={() => executeAction(onOpenLiveVoice)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="font-medium text-xs">Start Live Voice Conversation (Gemini 3.1 Flash Live)</span>
                </button>
              )}

              <button
                onClick={() => executeAction(onNewChat)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-xs">New Conversation</span>
              </button>

              <button
                onClick={() => executeAction(onOpenDataStudio)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-xs">Data Studio & Dashboard Generator</span>
              </button>

              <button
                onClick={() => executeAction(onOpenImageStudio)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-medium text-xs">Generative Image & Vision Studio</span>
              </button>

              <button
                onClick={() => executeAction(onOpenFiles)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-xs">Document RAG & Chunk Explorer</span>
              </button>

              <button
                onClick={() => executeAction(onOpenProjects)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-xs">Manage Project Workspaces</span>
              </button>

              <button
                onClick={() => executeAction(onOpenDiagnostics)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-xs">Diagnostics & Telemetry Health</span>
              </button>

              <button
                onClick={() => executeAction(onToggleTheme)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-xs">Toggle Dark / Light Theme</span>
              </button>
            </div>
          </div>

          {/* Conversations Matches */}
          {filteredConvs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Conversations
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredConvs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => executeAction(() => onSelectConversation(c.id))}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
                  >
                    <span className="truncate text-xs">{c.title}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Matches */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Uploaded Files
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => executeAction(onOpenFiles)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-left transition-colors"
                  >
                    <span className="truncate text-xs">{f.name}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Indexed</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
