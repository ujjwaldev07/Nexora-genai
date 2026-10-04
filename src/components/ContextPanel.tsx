import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Activity, 
  Sparkles, 
  Cpu, 
  HardDrive, 
  ChevronRight, 
  Upload, 
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import { DocumentFile, ExecutionMode, UserPreferences } from '../types';
import { formatFileSize } from '../lib/utils';

interface ContextPanelProps {
  files: DocumentFile[];
  activeExecutionMode: ExecutionMode;
  isOnline: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenFiles: () => void;
  onOpenDiagnostics: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  files,
  activeExecutionMode,
  isOnline,
  isOpen,
  onClose,
  onOpenFiles,
  onOpenDiagnostics,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[280px] sm:w-[300px] bg-slate-50 dark:bg-[#0D0D0D] border-l border-slate-200 dark:border-[#222222] flex flex-col shrink-0 select-none z-10 transition-all">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Context & Telemetry
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#1A1A1A] transition-colors"
          title="Close Context Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 text-xs">
        {/* Linked Resources Section */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Linked Resources ({files.length})
            </h3>
            <button
              onClick={onOpenFiles}
              className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>Manage</span>
            </button>
          </div>

          {files.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-[#222222] bg-white/50 dark:bg-[#141414] text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">No documents indexed</p>
              <button
                onClick={onOpenFiles}
                className="mt-1.5 text-[10px] font-semibold text-indigo-500 hover:underline"
              >
                + Add Documents or CSVs
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {files.slice(0, 4).map((file) => {
                const isCsv = file.name.endsWith('.csv') || file.type === 'csv';
                const isPdf = file.name.endsWith('.pdf');
                return (
                  <div
                    key={file.id}
                    className="p-2 bg-white dark:bg-[#1A1A1A] rounded-lg border border-slate-200/80 dark:border-[#222222] flex items-center gap-2.5 hover:border-slate-300 dark:hover:border-[#333333] transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[9px] shrink-0 ${
                        isCsv
                          ? 'bg-rose-500/10 text-rose-500'
                          : isPdf
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-indigo-500/10 text-indigo-500'
                      }`}
                    >
                      {isCsv ? 'CSV' : isPdf ? 'PDF' : 'DOC'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">
                        {formatFileSize(file.size)} • {file.chunks ? `${file.chunks.length} chunks` : 'RAG Ready'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {files.length > 4 && (
                <button
                  onClick={onOpenFiles}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-indigo-500 py-1"
                >
                  +{files.length - 4} more files indexed
                </button>
              )}
            </div>
          )}
        </section>

        {/* System Telemetry Section */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
            System Telemetry
          </h3>
          <div className="p-3 bg-white dark:bg-[#161616] rounded-xl border border-slate-200/80 dark:border-[#222222] space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400 dark:text-slate-500">ENGINE TYPE</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {activeExecutionMode === 'hybrid'
                    ? isOnline ? 'Gemini 3.7 + Local' : 'Offline Engine'
                    : activeExecutionMode === 'local-only'
                    ? 'Local Engine (Wasm/Ollama)'
                    : 'Air-Gapped Private'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#222222] h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-1 rounded-full w-[85%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400 dark:text-slate-500">INFERENCE SPEED</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">54.6 t/s</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#222222] h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-1 rounded-full w-[62%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400 dark:text-slate-500">MEMORY / VRAM</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">4.8 / 12 GB</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#222222] h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-1 rounded-full w-[40%]" />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-slate-100 dark:border-[#222222]">
              <span className="text-slate-400">LATENCY PING</span>
              <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                18ms
              </span>
            </div>
          </div>
        </section>

        {/* Real-time Insights Card */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
            Active Intelligence
          </h3>
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Contextual Cache Ready</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Full-document TF-IDF vector embeddings active with grounded citations and Recharts telemetry compiler.
            </p>
          </div>
        </section>
      </div>

      {/* Bottom Diagnostics Action */}
      <div className="p-3 border-t border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
        <button
          onClick={onOpenDiagnostics}
          className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-2 border border-slate-200 dark:border-[#333333] rounded-lg hover:border-slate-400 dark:hover:border-slate-500 flex items-center justify-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>Run System Diagnostics</span>
        </button>
      </div>
    </aside>
  );
};
