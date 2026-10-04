import React from 'react';
import { 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  Activity,
  BarChart3,
  FileText,
  Image as ImageIcon,
  PanelRightClose,
  PanelRight,
  Zap,
  Menu,
  Radio,
  Mic
} from 'lucide-react';
import { UserPreferences, Project } from '../types';

interface HeaderProps {
  preferences: UserPreferences;
  isOnline: boolean;
  activeProvider: string;
  activeProject?: Project;
  isContextPanelOpen: boolean;
  onToggleContextPanel: () => void;
  onOpenCommandPalette: () => void;
  onOpenLiveVoice?: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
  onOpenDataStudio: () => void;
  onOpenImageStudio: () => void;
  onOpenFiles: () => void;
  onOpenProjects: () => void;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  isOnline,
  activeProvider,
  activeProject,
  isContextPanelOpen,
  onToggleContextPanel,
  onOpenCommandPalette,
  onOpenLiveVoice,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenDataStudio,
  onOpenImageStudio,
  onOpenFiles,
  onOpenProjects,
  onToggleTheme,
  onToggleSidebar,
}) => {
  const isDark =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isPrivate = preferences.executionMode === 'private-offline';
  const isLocalOnly = preferences.executionMode === 'local-only';

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-[#08080C]/70 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none transition-colors">
      {/* Left: Branding & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A22] transition-colors"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-xs shadow-indigo-600/30">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight hidden sm:inline">
            NEXORA <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
          </span>
        </div>

        {/* Project Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm pl-2 border-l border-slate-200 dark:border-[#222228]">
          <button
            onClick={onOpenProjects}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors hidden sm:inline"
          >
            Projects
          </button>
          <span className="text-slate-300 dark:text-[#33333E] hidden sm:inline">/</span>
          {activeProject ? (
            <button
              onClick={onOpenProjects}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline max-w-[130px] truncate text-xs"
              title={activeProject.name}
            >
              {activeProject.name}
            </button>
          ) : (
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">Default Workspace</span>
          )}
        </div>
      </div>

      {/* Center: Search & Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#181820] hover:bg-slate-200/80 dark:hover:bg-[#20202A] text-slate-500 dark:text-slate-400 text-xs transition-all border border-slate-200 dark:border-[#262632] shadow-2xs w-48 lg:w-60 justify-between"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">Search or command...</span>
        </div>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#111116] border border-slate-200 dark:border-[#33333E] rounded text-slate-500 dark:text-slate-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right: Model Spec Badge & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Model Spec Badge */}
        <div 
          onClick={onOpenDiagnostics}
          className="cursor-pointer hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-[#181820] px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#262632] hover:border-indigo-500/40 transition-all"
          title="Click to view system status & telemetry"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight font-mono">
            {isPrivate 
              ? 'AIR-GAPPED' 
              : isLocalOnly || !isOnline 
              ? 'LOCAL-ENGINE' 
              : (preferences.preferredModel || 'gemini-3.5-flash').replace('gemini-', '').toUpperCase()}
          </span>
          <div className="w-[1px] h-2.5 bg-slate-300 dark:bg-[#33333E]" />
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            ONLINE
          </span>
        </div>

        {/* Quick Studio Launchers */}
        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-[#222228] pl-1.5">
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold transition-all shadow-2xs group"
              title="Start Real-Time Voice Conversation (gemini-3.1-flash-live-preview)"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
              <span className="hidden sm:inline">Live Voice</span>
            </button>
          )}
          <button
            onClick={onOpenDataStudio}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="Data & Dashboard Studio"
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </button>
          <button
            onClick={onOpenImageStudio}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="Generative Vision Studio"
          >
            <ImageIcon className="w-4 h-4 text-purple-500" />
          </button>
          <button
            onClick={onOpenFiles}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="Document RAG Manager"
          >
            <FileText className="w-4 h-4 text-blue-500" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-[#222228] pl-1.5">
          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="System Diagnostics & Telemetry"
          >
            <Activity className="w-4 h-4 text-cyan-500" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24] transition-colors"
            title="Workspace Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleContextPanel}
            className={`p-1.5 rounded-lg transition-colors ${
              isContextPanelOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-[#1E1E28] border border-indigo-200 dark:border-indigo-900/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C24]'
            }`}
            title="Toggle Context & Telemetry Panel"
          >
            {isContextPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
