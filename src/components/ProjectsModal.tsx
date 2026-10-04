import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Sliders, 
  FolderOpen 
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      systemInstruction: systemInstruction.trim() || undefined,
      documentIds: [],
    });
    setName('');
    setDescription('');
    setSystemInstruction('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Workspace Projects
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Group conversations, custom system instructions, and document knowledge bases.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Active project reset button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Global Workspace (All Chats)</div>
              <div className="text-slate-400 text-[11px]">Show all conversations without project filtering.</div>
            </div>
            <button
              onClick={() => onSelectProject(null)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeProjectId === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {activeProjectId === null ? 'Active' : 'Switch'}
            </button>
          </div>

          {/* Project List */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Custom Workspaces ({projects.length})</div>
            {projects.map((proj) => {
              const isActive = activeProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{proj.name}</span>
                    </div>
                    {proj.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{proj.description}</p>
                    )}
                    {proj.systemInstruction && (
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono line-clamp-1">
                        Prompt: {proj.systemInstruction}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectProject(proj.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Select'}
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New Project Section */}
          {isCreating ? (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Create New Workspace</h4>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Financial Modeling 2026"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project goal and scope"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Custom System Instruction (AI Persona)</label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="You are an expert financial auditor specializing in SaaS metrics..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-500" />
              <span>Create New Project Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
