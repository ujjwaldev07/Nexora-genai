import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit2, 
  Archive, 
  FolderTree, 
  FileText, 
  BarChart3, 
  Image as ImageIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Activity,
  Zap,
  Radio,
  Mic
} from 'lucide-react';
import { Conversation, Project } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  projects: Project[];
  activeProjectId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
  onOpenLiveVoice?: () => void;
  onOpenProjects: () => void;
  onOpenFiles: () => void;
  onOpenDataStudio: () => void;
  onOpenImageStudio: () => void;
  onOpenDiagnostics: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  projects,
  activeProjectId,
  isCollapsed,
  onToggleCollapse,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onPinConversation,
  onArchiveConversation,
  onOpenLiveVoice,
  onOpenProjects,
  onOpenFiles,
  onOpenDataStudio,
  onOpenImageStudio,
  onOpenDiagnostics,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    if (searchQuery.trim() && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeProjectId && c.projectId !== activeProjectId) {
      return false;
    }
    return true;
  });

  const pinnedConvs = filteredConvs.filter((c) => c.isPinned && !c.isArchived);
  const regularConvs = filteredConvs.filter((c) => !c.isPinned && !c.isArchived);
  const archivedConvs = filteredConvs.filter((c) => c.isArchived);

  const startRename = (c: Conversation) => {
    setEditingConvId(c.id);
    setEditingTitle(c.title);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 border-r border-slate-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-[#09090D]/70 backdrop-blur-xl flex flex-col items-center py-3 justify-between shrink-0 select-none z-20">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1E1E26] transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNewConversation}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 transition-all"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="p-2 rounded-lg text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              title="Live Voice Conversation (gemini-3.1-flash-live-preview)"
            >
              <Radio className="w-4 h-4 animate-pulse" />
            </button>
          )}
          <button
            onClick={onOpenDataStudio}
            className="p-2 rounded-lg text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1E1E26] transition-colors"
            title="Data Studio"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenImageStudio}
            className="p-2 rounded-lg text-slate-500 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-[#1E1E26] transition-colors"
            title="Generative Vision Studio"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenFiles}
            className="p-2 rounded-lg text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1E1E26] transition-colors"
            title="Document RAG"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenProjects}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#1E1E26] transition-colors"
            title="Projects"
          >
            <FolderTree className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 sm:w-72 border-r border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#09090D]/70 backdrop-blur-xl flex flex-col justify-between shrink-0 select-none z-20 transition-all">
      {/* Top Header Actions */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#222228] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onNewConversation}
            className="flex-1 bg-white dark:bg-[#1A1A22] hover:bg-slate-100 dark:hover:bg-[#22222C] border border-slate-200 dark:border-[#2A2A35] text-slate-800 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>New Conversation</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-[#1E1E26] transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* High-density Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter conversations..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181820] border border-slate-200 dark:border-[#262632] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Live Voice & Studio Launcher */}
        {onOpenLiveVoice && (
          <button
            onClick={onOpenLiveVoice}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 hover:from-indigo-600/20 hover:to-purple-600/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Live Voice (Flash 3.1)</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-500 font-normal">
              24kHz
            </span>
          </button>
        )}
      </div>

      {/* Conversation & Project Lists */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
        {/* Active Projects Quick Access */}
        {projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Active Projects</span>
              <button
                onClick={onOpenProjects}
                className="text-[10px] text-indigo-500 hover:underline lowercase tracking-normal font-normal"
              >
                manage
              </button>
            </div>
            <div className="space-y-1 mt-1">
              {projects.slice(0, 3).map((proj) => {
                const isSelected = activeProjectId === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={onOpenProjects}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-[#1D1D26] text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-200/50 dark:border-[#2C2C3A]'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181820]'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                    <span className="truncate flex-1">{proj.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned Section */}
        {pinnedConvs.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Pin className="w-3 h-3 text-amber-500" />
              <span>Pinned</span>
            </div>
            <div className="space-y-1 mt-1">
              {pinnedConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {/* Recent Chats Section */}
        <div>
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <span>Recent Chats</span>
            <span className="text-[10px] font-normal text-slate-400">({regularConvs.length})</span>
          </div>
          {regularConvs.length === 0 ? (
            <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-xs">
              No conversations yet.
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {regularConvs.map((conv) => renderConversationItem(conv))}
            </div>
          )}
        </div>

        {/* Archived Section */}
        {archivedConvs.length > 0 && (
          <div>
            <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Archive className="w-3 h-3" />
              <span>Archived ({archivedConvs.length})</span>
            </div>
            <div className="space-y-1 mt-1 opacity-70">
              {archivedConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Status & User Card */}
      <div className="p-3 border-t border-slate-200 dark:border-[#222228] bg-white/90 dark:bg-[#0E0E12]/90 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono px-1">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            NEXORA ENGINE
          </span>
          <span 
            onClick={onOpenDiagnostics}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer text-[10px]"
          >
            v3.2.0-fast
          </span>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-slate-100/90 dark:bg-[#181820] rounded-xl border border-slate-200/60 dark:border-[#262632]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">Nexora Workspace</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Enterprise Intelligence</p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#22222C] transition-colors"
            title="Settings"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  function renderConversationItem(conv: Conversation) {
    const isActive = activeConversationId === conv.id;
    const isEditing = editingConvId === conv.id;

    if (isEditing) {
      return (
        <div key={conv.id} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-50 dark:bg-[#1D1D26] border border-indigo-300 dark:border-indigo-700">
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveRename(conv.id)}
            autoFocus
            className="flex-1 text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => saveRename(conv.id)}
            className="p-1 text-emerald-600 hover:text-emerald-700"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
          isActive
            ? 'bg-indigo-50 dark:bg-[#1D1D26] text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-200/60 dark:border-[#2C2C3A]'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181820]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
          <span className="truncate text-xs">{conv.title}</span>
        </div>

        {/* Action Menu Buttons */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinConversation(conv.id);
            }}
            className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-slate-200/80 dark:hover:bg-[#22222C]"
            title={conv.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className={`w-3 h-3 ${conv.isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              startRename(conv);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/80 dark:hover:bg-[#22222C]"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(conv.id);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/80 dark:hover:bg-[#22222C]"
            title="Delete conversation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
