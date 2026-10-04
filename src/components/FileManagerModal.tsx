import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Search, 
  Layers, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Eye,
  Database,
  ArrowRight
} from 'lucide-react';
import { DocumentFile, DocumentChunk } from '../types';
import { ragEngine } from '../lib/ai/ragEngine';
import { formatFileSize } from '../lib/utils';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: DocumentFile[];
  onUploadFiles: (files: FileList | null) => void;
  onDeleteFile: (id: string) => void;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  files,
  onUploadFiles,
  onDeleteFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(files[0] || null);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleTestSearch = () => {
    if (!testQuery.trim()) return;
    const results = ragEngine.retrieve(testQuery.trim(), 4);
    setTestResults(results);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Document Intelligence & RAG Index
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage indexed vector/TF-IDF document knowledge bases and inspect chunk embeddings.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Left: Document List & Upload */}
          <div className="space-y-3 md:border-r md:border-slate-200 md:dark:border-slate-800 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Indexed Documents ({files.length})
              </span>
              <label className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer transition-colors">
                <Upload className="w-3 h-3" />
                <span>Upload</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.csv,.json,.xlsx,.docx"
                  onChange={(e) => onUploadFiles(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {files.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No documents indexed yet. Upload a file above.
                </div>
              ) : (
                files.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFile(f)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                      selectedFile?.id === f.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[130px]">{f.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(f.size)} • {(f.chunks || []).length} chunks</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(f.id);
                        if (selectedFile?.id === f.id) setSelectedFile(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center & Right: Document Chunks & RAG Retriever Sandbox */}
          <div className="md:col-span-2 space-y-4">
            {/* RAG Retrieval Tester */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>RAG Retrieval Vector/TF-IDF Simulator</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
                  placeholder="Test a search query against indexed knowledge..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleTestSearch}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  Test Query
                </button>
              </div>

              {testResults.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="font-semibold text-[11px] text-slate-500">
                    Retrieved Top {testResults.length} Chunks:
                  </div>
                  {testResults.map((res, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>{res.chunk.documentName} (Chunk #{res.chunk.chunkIndex})</span>
                        <span className="text-[10px] text-emerald-600 font-mono">Score: {res.score.toFixed(3)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-mono">{(res.chunk.content || res.chunk.text || '').substring(0, 160)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Document Chunks Inspector */}
            {selectedFile && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Chunk Inspector for "{selectedFile.name}" ({(selectedFile.chunks || []).length} segments)
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(selectedFile.chunks || []).map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span>Chunk #{chunk.chunkIndex}</span>
                        <span>{chunk.tokenCount || (chunk.content || chunk.text || '').length} chars</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-3">
                        {chunk.content || chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
