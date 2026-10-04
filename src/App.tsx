import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { CommandPalette } from './components/CommandPalette';
import { DataStudioModal } from './components/DataStudioModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { FileManagerModal } from './components/FileManagerModal';
import { ProjectsModal } from './components/ProjectsModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { SettingsModal } from './components/SettingsModal';
import { ContextPanel } from './components/ContextPanel';
import { AmbientBackground } from './components/AmbientBackground';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { LiveTranscriptItem } from './lib/ai/liveAudio';

import { 
  Conversation, 
  Message, 
  Attachment, 
  ExecutionMode, 
  UserPreferences, 
  Project, 
  DocumentFile, 
  DashboardData, 
  ReportData 
} from './types';
import { localDb } from './lib/storage/indexedDb';
import { syncEngine } from './lib/storage/syncEngine';
import { localEngine } from './lib/ai/localEngine';
import { ragEngine } from './lib/ai/ragEngine';
import { getRoleById } from './lib/ai/roles';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  executionMode: 'hybrid',
  defaultModel: 'gemini-3.5-flash',
  preferredModel: 'gemini-3.5-flash',
  activeRoleId: 'general-assistant',
  autoFallback: true,
  streamResponses: true,
  ollamaUrl: 'http://localhost:11434',
  localModelName: 'llama3',
  customSystemPrompt: '',
};

export function App() {
  // State
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState<boolean>(true);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const [isDataStudioOpen, setIsDataStudioOpen] = useState<boolean>(false);
  const [imageStudioConfig, setImageStudioConfig] = useState<{
    isOpen: boolean;
    initialMode?: 'create' | 'edit';
    initialImage?: string;
    initialPrompt?: string;
  }>({ isOpen: false });
  const [isFileManagerOpen, setIsFileManagerOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isDark =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 1. Initial Load & Persistence
  useEffect(() => {
    async function init() {
      // Load preferences
      const savedPrefs = await localDb.getPreferences();
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }

      // Load Projects
      const savedProjects = await localDb.getAllProjects();
      setProjects(savedProjects);

      // Load Documents
      const savedDocs = await localDb.getAllDocuments();
      setFiles(savedDocs);
      savedDocs.forEach((doc) => ragEngine.indexDocument(doc));

      // Load Conversations
      const savedConvs = await localDb.getAllConversations();
      setConversations(savedConvs);

      if (savedConvs.length > 0) {
        const firstId = savedConvs[0].id;
        setActiveConversationId(firstId);
        const convMsgs = await localDb.getMessagesByConversation(firstId);
        setMessages(convMsgs);
      } else {
        handleNewConversation();
      }

      // Online status listener
      setIsOnline(syncEngine.isOnline());
      const unsub = syncEngine.onOnlineChange((online) => setIsOnline(online));
      return () => unsub();
    }

    init();
  }, []);

  // 2. Apply Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle active conversation change
  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    const msgs = await localDb.getMessagesByConversation(id);
    setMessages(msgs);
  }, []);

  // Create new conversation
  const handleNewConversation = useCallback(async () => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId: activeProjectId || undefined,
    };

    await localDb.saveConversation(newConv);
    await syncEngine.recordChange('create_conv', newConv.id, newConv);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
  }, [activeProjectId]);

  // Rename conversation
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated = { ...conv, title: newTitle, updatedAt: Date.now() };
    await localDb.saveConversation(updated);
    await syncEngine.recordChange('update_conv', id, updated);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, [conversations]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    await localDb.deleteConversation(id);
    await syncEngine.recordChange('delete_conv', id, null);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else {
        handleNewConversation();
      }
    }
  }, [activeConversationId, conversations, handleSelectConversation, handleNewConversation]);

  // Pin/Unpin
  const handlePinConversation = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated = { ...conv, isPinned: !conv.isPinned, updatedAt: Date.now() };
    await localDb.saveConversation(updated);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, [conversations]);

  // Archive/Unarchive
  const handleArchiveConversation = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated = { ...conv, isArchived: !conv.isArchived, updatedAt: Date.now() };
    await localDb.saveConversation(updated);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, [conversations]);

  // 3. Main Chat & Prompt Submission with Optimized Throttled Streaming
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    mode: ExecutionMode = preferences.executionMode,
    model?: string,
    roleId?: string
  ) => {
    let convId = activeConversationId;
    const currentRoleId = roleId || preferences.activeRoleId || 'general-assistant';
    const activeRole = getRoleById(currentRoleId);
    const activeProj = projects.find((p) => p.id === activeProjectId);
    const systemPrompt = preferences.customSystemPrompt || activeProj?.systemInstruction || activeRole.systemInstruction;
    const selectedModel = model || preferences.preferredModel || activeRole.recommendedModel;

    if (!convId) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: content.substring(0, 30) || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        projectId: activeProjectId || undefined,
        roleId: activeRole.id,
        roleName: activeRole.name,
        modelUsed: selectedModel,
        systemInstruction: systemPrompt,
      };
      await localDb.saveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    } else {
      const currentConv = conversations.find((c) => c.id === convId);
      if (currentConv && currentConv.title === 'New Conversation' && content) {
        handleRenameConversation(convId, content.substring(0, 32));
      }
    }

    // 1. Add User Message
    const userMsg: Message = {
      id: 'msg_user_' + Date.now(),
      conversationId: convId,
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    await localDb.saveMessage(userMsg);
    await syncEngine.recordChange('create_msg', userMsg.id, userMsg);
    setMessages((prev) => [...prev, userMsg]);

    // 2. Prepare Assistant Placeholder
    const assistantMsgId = 'msg_ai_' + Date.now();
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      roleId: activeRole.id,
      roleName: activeRole.name,
      model: selectedModel,
      provider: mode === 'hybrid' && isOnline ? selectedModel : 'local-engine',
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    const history = messages
      .filter((m) => m.conversationId === convId && !m.isStreaming && m.id !== userMsg.id)
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

    const isPrivate = mode === 'private-offline';
    const isLocalOnly = mode === 'local-only';

    if (isPrivate || isLocalOnly || !isOnline) {
      try {
        const localResult = await localEngine.generateResponse(content, {
          systemInstruction: systemPrompt,
          attachments,
        });

        const finalMsg: Message = {
          ...assistantMsg,
          content: localResult.content,
          isStreaming: false,
          toolCalls: localResult.toolCalls,
          citations: localResult.citations,
          dashboardData: localResult.dashboardData,
          reportData: localResult.reportData,
          provider: 'local-engine',
          model: 'nexora-local-v1',
        };

        await localDb.saveMessage(finalMsg);
        await syncEngine.recordChange('create_msg', finalMsg.id, finalMsg);
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? finalMsg : m)));
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Error: ${err.message}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Server-Sent Events (SSE) Streaming with throttled UI state flush
    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: content,
          history,
          attachments,
          systemInstruction: systemPrompt,
          mode,
          model: selectedModel,
          roleId: activeRole.id,
          roleName: activeRole.name,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let activeModelName = selectedModel;
      let shouldFallbackToLocal = false;
      let lastFlushTime = 0;
      let flushTimeout: any = null;

      const flushTextToState = (immediate = false) => {
        const now = Date.now();
        if (immediate || now - lastFlushTime > 25) {
          lastFlushTime = now;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullText } : m
            )
          );
        } else if (!flushTimeout) {
          flushTimeout = setTimeout(() => {
            flushTimeout = null;
            lastFlushTime = Date.now();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: fullText } : m
              )
            );
          }, 30);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                flushTextToState(false);
              }
              if (data.model) {
                activeModelName = data.model;
              }
              if (data.message) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, reasoningStatus: data.message } : m
                  )
                );
              }
              if (data.reason) {
                shouldFallbackToLocal = true;
              }
            } catch {}
          }
        }
      }

      if (flushTimeout) clearTimeout(flushTimeout);
      flushTextToState(true);

      if (shouldFallbackToLocal || !fullText.trim()) {
        const localResult = await localEngine.generateResponse(content, {
          systemInstruction: systemPrompt,
          attachments,
        });
        fullText = localResult.content;
      }

      const finalMsg: Message = {
        ...assistantMsg,
        content: fullText,
        isStreaming: false,
        reasoningStatus: undefined,
        model: activeModelName,
        provider: 'gemini',
      };

      await localDb.saveMessage(finalMsg);
      await syncEngine.recordChange('create_msg', finalMsg.id, finalMsg);
      setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? finalMsg : m)));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const localResult = await localEngine.generateResponse(content, {
          systemInstruction: systemPrompt,
          attachments,
        });

        const fallbackMsg: Message = {
          ...assistantMsg,
          content: localResult.content,
          isStreaming: false,
          toolCalls: localResult.toolCalls,
          citations: localResult.citations,
          dashboardData: localResult.dashboardData,
          reportData: localResult.reportData,
          provider: 'local-fallback',
        };

        await localDb.saveMessage(fallbackMsg);
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? fallbackMsg : m)));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleRegenerate = async (messageId: string) => {
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;

    let userPrompt = '';
    let attachments: Attachment[] = [];
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userPrompt = messages[i].content;
        attachments = messages[i].attachments || [];
        break;
      }
    }

    if (!userPrompt) return;
    await handleSendMessage(userPrompt, attachments);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, userFeedback: type } : m))
    );
  };

  const handleSendDashboardToChat = async (dashboard: DashboardData) => {
    let convId = activeConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: dashboard.title || 'Analytics Dashboard',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await localDb.saveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const msg: Message = {
      id: 'msg_dash_' + Date.now(),
      conversationId: convId,
      role: 'assistant',
      content: `I've synthesized your tabular dataset into an interactive high-density dashboard: **${dashboard.title}**.`,
      dashboardData: dashboard,
      timestamp: Date.now(),
      provider: 'data-studio',
      model: 'nexora-analytics',
    };

    await localDb.saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendReportToChat = async (report: ReportData) => {
    let convId = activeConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: report.title || 'Executive Report',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await localDb.saveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const msg: Message = {
      id: 'msg_rep_' + Date.now(),
      conversationId: convId,
      role: 'assistant',
      content: `Here is the comprehensive analytical report generated from your statistical profile:`,
      reportData: report,
      timestamp: Date.now(),
      provider: 'data-studio',
      model: 'nexora-report',
    };

    await localDb.saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendImageToChat = async (imageUrl: string, prompt: string) => {
    let convId = activeConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: `Vision: ${prompt.substring(0, 24)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await localDb.saveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const msg: Message = {
      id: 'msg_img_' + Date.now(),
      conversationId: convId,
      role: 'assistant',
      content: `Generated visual asset using Imagen 3.0: "${prompt}"`,
      generatedImageUrl: imageUrl,
      timestamp: Date.now(),
      provider: 'imagen-3.0',
      model: 'imagen-3.0-generate-002',
    };

    await localDb.saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
  };

  const handleSaveLiveVoiceToChat = async (liveTranscripts: LiveTranscriptItem[]) => {
    if (!liveTranscripts || liveTranscripts.length === 0) return;

    let convId = activeConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: 'conv_voice_' + Date.now(),
        title: `Live Voice Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await localDb.saveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const savedNewMessages: Message[] = [];

    for (let i = 0; i < liveTranscripts.length; i++) {
      const t = liveTranscripts[i];
      const msg: Message = {
        id: 'msg_v_' + Date.now() + '_' + i,
        conversationId: convId,
        role: t.role === 'user' ? 'user' : 'assistant',
        content: t.text,
        timestamp: t.timestamp || Date.now(),
        provider: 'gemini-live',
        model: 'gemini-3.1-flash-live-preview',
      };
      await localDb.saveMessage(msg);
      savedNewMessages.push(msg);
    }

    setMessages((prev) => [...prev, ...savedNewMessages]);
  };

  const handleOpenImageStudio = (
    mode: 'create' | 'edit' = 'create',
    initialImage?: string,
    initialPrompt?: string
  ) => {
    setImageStudioConfig({
      isOpen: true,
      initialMode: mode,
      initialImage,
      initialPrompt,
    });
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const newDoc: DocumentFile = {
        id: 'doc_' + Date.now() + '_' + i,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'text/plain',
        type: file.type || 'text/plain',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        uploadedAt: Date.now(),
        chunksCount: 1,
        chunks: [
          {
            id: 'chunk_' + Date.now() + '_' + i,
            documentId: 'doc_' + Date.now() + '_' + i,
            documentName: file.name,
            chunkIndex: 0,
            content: `Imported document: ${file.name}`,
          },
        ],
        status: 'indexed',
        summary: `Imported document: ${file.name}`,
      };
      await localDb.saveDocument(newDoc);
      ragEngine.indexDocument(newDoc);
      setFiles((prev) => [...prev, newDoc]);
    }
  };

  const handleDeleteFile = async (id: string) => {
    await localDb.deleteDocument(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreateProject = async (projData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProj: Project = {
      ...projData,
      id: 'proj_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await localDb.saveProject(newProj);
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
  };

  const handleDeleteProject = async (id: string) => {
    await localDb.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const handleClearAllData = async () => {
    await localDb.clearAll();
    setConversations([]);
    setMessages([]);
    setProjects([]);
    setFiles([]);
    setActiveConversationId(null);
    setActiveProjectId(null);
    handleNewConversation();
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Derive Attention-Aware Ambient Activity State
  const ambientActivityState = React.useMemo<'idle' | 'typing' | 'thinking' | 'streaming' | 'reading'>(() => {
    if (isStreaming) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && (!lastMsg.content || lastMsg.reasoningStatus)) {
        return 'thinking';
      }
      return 'streaming';
    }
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content && lastMsg.content.length > 250) {
        return 'reading';
      }
    }
    return 'idle';
  }, [isStreaming, messages]);

  // Dynamically update CSS animation timing variables based on AI state machine activity
  React.useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    if (ambientActivityState === 'thinking') {
      root.style.setProperty('--arc-duration-left-outer', '14s');
      root.style.setProperty('--arc-duration-left-glow', '10s');
      root.style.setProperty('--arc-duration-left-haze', '18s');
      root.style.setProperty('--arc-duration-right-outer', '16s');
      root.style.setProperty('--arc-duration-right-glow', '12s');
      root.style.setProperty('--arc-duration-right-haze', '20s');
      root.style.setProperty('--atmosphere-breathe-duration', '14s');
      root.style.setProperty('--light-sweep-duration', '12s');
    } else if (ambientActivityState === 'streaming') {
      root.style.setProperty('--arc-duration-left-outer', '18s');
      root.style.setProperty('--arc-duration-left-glow', '14s');
      root.style.setProperty('--arc-duration-left-haze', '24s');
      root.style.setProperty('--arc-duration-right-outer', '22s');
      root.style.setProperty('--arc-duration-right-glow', '16s');
      root.style.setProperty('--arc-duration-right-haze', '26s');
      root.style.setProperty('--atmosphere-breathe-duration', '18s');
      root.style.setProperty('--light-sweep-duration', '16s');
    } else if (ambientActivityState === 'reading') {
      root.style.setProperty('--arc-duration-left-outer', '42s');
      root.style.setProperty('--arc-duration-left-glow', '32s');
      root.style.setProperty('--arc-duration-left-haze', '52s');
      root.style.setProperty('--arc-duration-right-outer', '48s');
      root.style.setProperty('--arc-duration-right-glow', '38s');
      root.style.setProperty('--arc-duration-right-haze', '58s');
      root.style.setProperty('--atmosphere-breathe-duration', '44s');
      root.style.setProperty('--light-sweep-duration', '40s');
    } else if (ambientActivityState === 'typing') {
      root.style.setProperty('--arc-duration-left-outer', '30s');
      root.style.setProperty('--arc-duration-left-glow', '24s');
      root.style.setProperty('--arc-duration-left-haze', '40s');
      root.style.setProperty('--arc-duration-right-outer', '36s');
      root.style.setProperty('--arc-duration-right-glow', '28s');
      root.style.setProperty('--arc-duration-right-haze', '44s');
      root.style.setProperty('--atmosphere-breathe-duration', '32s');
      root.style.setProperty('--light-sweep-duration', '30s');
    } else {
      // Idle normal timings
      root.style.setProperty('--arc-duration-left-outer', '24s');
      root.style.setProperty('--arc-duration-left-glow', '18s');
      root.style.setProperty('--arc-duration-left-haze', '32s');
      root.style.setProperty('--arc-duration-right-outer', '30s');
      root.style.setProperty('--arc-duration-right-glow', '22s');
      root.style.setProperty('--arc-duration-right-haze', '36s');
      root.style.setProperty('--atmosphere-breathe-duration', '26s');
      root.style.setProperty('--light-sweep-duration', '24s');
    }
  }, [ambientActivityState]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#0A0A0D] text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative">
      <AmbientBackground theme={preferences.theme} activityState={ambientActivityState} />

      {/* 1. Header */}
      <Header
        preferences={preferences}
        isOnline={isOnline}
        activeProvider="gemini"
        activeProject={activeProject}
        isContextPanelOpen={isContextPanelOpen}
        onToggleContextPanel={() => setIsContextPanelOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenDataStudio={() => setIsDataStudioOpen(true)}
        onOpenImageStudio={() => handleOpenImageStudio('create')}
        onOpenFiles={() => setIsFileManagerOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onToggleTheme={() => {
          const next = isDark ? 'light' : 'dark';
          const updated = { ...preferences, theme: next as 'light' | 'dark' };
          setPreferences(updated);
          localDb.savePreferences(updated);
        }}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          projects={projects}
          activeProjectId={activeProjectId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onPinConversation={handlePinConversation}
          onArchiveConversation={handleArchiveConversation}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          onOpenProjects={() => setIsProjectsOpen(true)}
          onOpenFiles={() => setIsFileManagerOpen(true)}
          onOpenDataStudio={() => setIsDataStudioOpen(true)}
          onOpenImageStudio={() => handleOpenImageStudio('create')}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Chat Flow & Composer */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            onRegenerate={handleRegenerate}
            onEditUserMessage={(id, text) => handleSendMessage(text)}
            onFeedback={handleFeedback}
            onSelectPromptTemplate={(prompt) => handleSendMessage(prompt)}
            onOpenImageStudio={() => handleOpenImageStudio('create')}
            onEditImage={(imageUrl, prompt) => handleOpenImageStudio('edit', imageUrl, prompt)}
          />

          <Composer
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            isStreaming={isStreaming}
            preferences={preferences}
            onUpdatePreferences={(newPrefs) => {
              const updated = { ...preferences, ...newPrefs };
              setPreferences(updated);
              localDb.savePreferences(updated);
            }}
            isOnline={isOnline}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          />
        </main>

        {/* Context & Telemetry Panel */}
        <ContextPanel
          files={files}
          activeExecutionMode={preferences.executionMode}
          isOnline={isOnline}
          isOpen={isContextPanelOpen}
          onClose={() => setIsContextPanelOpen(false)}
          onOpenFiles={() => setIsFileManagerOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        />
      </div>

      {/* 3. Global Modals & Palettes */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewChat={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenDataStudio={() => setIsDataStudioOpen(true)}
        onOpenImageStudio={() => handleOpenImageStudio('create')}
        onOpenFiles={() => setIsFileManagerOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTheme={() => {
          const next = isDark ? 'light' : 'dark';
          const updated = { ...preferences, theme: next as 'light' | 'dark' };
          setPreferences(updated);
          localDb.savePreferences(updated);
        }}
        conversations={conversations}
        files={files}
      />

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        onSaveToChat={handleSaveLiveVoiceToChat}
        preferences={preferences}
      />

      <DataStudioModal
        isOpen={isDataStudioOpen}
        onClose={() => setIsDataStudioOpen(false)}
        onSendDashboardToChat={handleSendDashboardToChat}
        onSendReportToChat={handleSendReportToChat}
      />

      <ImageStudioModal
        isOpen={imageStudioConfig.isOpen}
        onClose={() => setImageStudioConfig((prev) => ({ ...prev, isOpen: false }))}
        onSendImageToChat={handleSendImageToChat}
        initialMode={imageStudioConfig.initialMode}
        initialImage={imageStudioConfig.initialImage}
        initialPrompt={imageStudioConfig.initialPrompt}
      />

      <FileManagerModal
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        files={files}
        onUploadFiles={handleUploadFiles}
        onDeleteFile={handleDeleteFile}
      />

      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={(prefs) => {
          setPreferences(prefs);
          localDb.savePreferences(prefs);
        }}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}

export default App;
