import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Download, 
  Trash2, 
  X, 
  Save, 
  User, 
  HardDrive,
  Database,
  Moon,
  Sun
} from 'lucide-react';
import { UserPreferences, ExecutionMode } from '../types';
import { localDb } from '../lib/storage/indexedDb';
import { downloadJson } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onClearAllData,
}) => {
  const [formData, setFormData] = useState<UserPreferences>({ ...preferences });
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences(formData);
    onClose();
  };

  const handleExportBackup = async () => {
    const convs = await localDb.getAllConversations();
    const files = await localDb.getAllDocuments();
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      conversations: convs,
      files: files,
      preferences: formData,
    };
    downloadJson(`aether_workspace_backup_${Date.now()}.json`, backup);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Workspace Settings & AI Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure execution modes, local Ollama endpoints, AI persona, and data persistence.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* AI Execution Mode */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200">
              Primary AI Execution Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, executionMode: 'hybrid' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.executionMode === 'hybrid'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-500 mb-1" />
                <div className="font-semibold">Hybrid Mode</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cloud Gemini with offline local fallback</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, executionMode: 'local-only' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.executionMode === 'local-only'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-500 mb-1" />
                <div className="font-semibold">Local AI Only</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Runs on-device via built-in engine or Ollama</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, executionMode: 'private-offline' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.executionMode === 'private-offline'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 mb-1" />
                <div className="font-semibold">Private Offline</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Zero network activity, strict data isolation</div>
              </button>
            </div>
          </div>

          {/* Local Ollama Endpoint Config */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Local Ollama Server Integration</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Ollama Host URL</label>
                <input
                  type="text"
                  value={formData.ollamaUrl || 'http://localhost:11434'}
                  onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Default Local Model</label>
                <input
                  type="text"
                  value={formData.localModelName || 'llama3'}
                  onChange={(e) => setFormData({ ...formData, localModelName: e.target.value })}
                  placeholder="llama3, mistral, phi3, etc."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom Persona & System Prompt */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Default System Instructions & Persona
            </label>
            <textarea
              value={formData.customSystemPrompt || ''}
              onChange={(e) => setFormData({ ...formData, customSystemPrompt: e.target.value })}
              placeholder="e.g. You are a senior full-stack AI engineer. Always provide clear, production-grade solutions..."
              rows={3}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Theme Preference */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200">
              Appearance Theme
            </label>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: t })}
                  className={`flex-1 py-2 rounded-lg border capitalize font-medium transition-all ${
                    formData.theme === t
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Data & Backup Management */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Local Data Persistence & Backups
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Workspace Backup (JSON)</span>
              </button>

              {showConfirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-semibold">Erase all chats & files?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      setShowConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    Confirm Erase
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Workspace Data</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
