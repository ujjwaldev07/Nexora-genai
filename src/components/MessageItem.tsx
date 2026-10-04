import React, { useState, memo } from 'react';
import { 
  User, 
  FileText, 
  Wand2, 
  Check, 
  Copy, 
  Edit2
} from 'lucide-react';
import { Message } from '../types';
import { formatFileSize } from '../lib/utils';
import { AIResponse } from './response/AIResponse';
import { ErrorDisplay } from './response/ErrorDisplay';
import { AICoreOrb } from './motion/AICoreOrb';

interface MessageItemProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onEditUserMessage?: (id: string, newContent: string) => void;
  onFeedback?: (id: string, feedback: 'like' | 'dislike') => void;
  onEditImage?: (imageUrl: string, prompt?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = memo(({
  message,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
  onEditImage,
}) => {
  const [copiedUser, setCopiedUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);

  const isUser = message.role === 'user';

  const copyUserContent = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editedText.trim() && onEditUserMessage) {
      onEditUserMessage(message.id, editedText);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`py-3.5 px-3 sm:px-5 transition-all duration-200 rounded-2xl ${
        isUser 
          ? 'bg-transparent' 
          : 'bg-slate-50/70 dark:bg-white/[0.025] border border-slate-200/60 dark:border-white/[0.06] backdrop-blur-md shadow-xs'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200 dark:bg-[#1E1E24] border border-slate-300 dark:border-[#33333C] flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs">
              <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
              <AICoreOrb 
                size="xs" 
                state={
                  message.error 
                    ? 'error' 
                    : message.isStreaming 
                      ? (message.reasoningStatus || !message.content ? 'thinking' : 'streaming') 
                      : 'idle'
                } 
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {isUser ? (
            <div className="space-y-2 group/user">
              {/* User Meta Row */}
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  You
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="opacity-0 group-hover/user:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={copyUserContent}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy text"
                    >
                      {copiedUser ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {onEditUserMessage && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Bubble Card */}
              {isEditing ? (
                <div className="space-y-2 p-3 rounded-2xl bg-slate-100/90 dark:bg-white/[0.05] border border-indigo-500/50">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none resize-none text-slate-800 dark:text-slate-200"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setEditedText(message.content);
                        setIsEditing(false);
                      }}
                      className="px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                    >
                      Save & Resubmit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13.5px] text-slate-800 dark:text-slate-200 leading-relaxed space-y-2 shadow-2xs">
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Attachments Preview */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {message.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202026] border border-slate-200 dark:border-[#2E2E36] text-xs text-slate-700 dark:text-slate-300 shadow-xs"
                        >
                          {att.type === 'image' && att.dataBase64 ? (
                            <img
                              src={att.dataBase64}
                              alt={att.name}
                              className="w-8 h-8 object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate max-w-[140px] font-medium text-xs">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                          </div>
                          {att.type === 'image' && att.dataBase64 && onEditImage && (
                            <button
                              onClick={() => onEditImage(att.dataBase64!, `Edit ${att.name}`)}
                              className="ml-1 px-2 py-0.5 rounded text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center gap-1 font-medium transition-colors"
                              title="Open in Image Studio"
                            >
                              <Wand2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Error state if present */}
              {message.error ? (
                <ErrorDisplay
                  error={message.error}
                  onRetry={onRegenerate ? () => onRegenerate(message.id) : undefined}
                />
              ) : (
                /* Main AI Response Semantic Hierarchy Engine */
                <AIResponse
                  message={message}
                  onRegenerate={onRegenerate}
                  onFeedback={onFeedback}
                  onEditImage={onEditImage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

