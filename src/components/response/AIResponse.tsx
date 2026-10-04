import React, { useState, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Copy, 
  Check, 
  RotateCw, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Wrench,
  Image as ImageIcon,
  Wand2,
  Download,
  FileText,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Message, Citation } from '../../types';
import { CodeBlock } from './CodeBlock';
import { CalloutBlock, detectCalloutType } from './CalloutBlock';
import { TableRenderer } from './TableRenderer';
import { StepItem } from './StepItem';
import { DashboardViewer } from '../DashboardViewer';
import { ReportViewer } from '../ReportViewer';
import { AICoreOrb } from '../motion/AICoreOrb';

interface AIResponseProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onFeedback?: (id: string, feedback: 'like' | 'dislike') => void;
  onEditImage?: (imageUrl: string, prompt?: string) => void;
}

export const AIResponse: React.FC<AIResponseProps> = memo(({
  message,
  onRegenerate,
  onFeedback,
  onEditImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Copy full clean response content
  const copyFullResponse = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-To-Speech reader
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown syntax for speech
    const cleanSpeechText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="group/response relative text-slate-800 dark:text-slate-100 space-y-3 font-sans">
      {/* 1. Subtle Response Header Bar */}
      <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-white/[0.04] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{message.roleName || 'Nexora AI'}</span>
          </div>

          {message.provider && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] flex items-center gap-1 font-mono">
              {message.provider.includes('local') ? (
                <>
                  <Cpu className="w-2.5 h-2.5 text-emerald-500" />
                  <span>Local Engine</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-medium">{message.model || 'Gemini 3.5 Flash'}</span>
                </>
              )}
            </span>
          )}

          {message.timestamp && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Quick Header Actions */}
        {!message.isStreaming && (
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <button
              onClick={copyFullResponse}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              title="Copy entire response"
              aria-label="Copy entire response"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={toggleSpeech}
              className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors ${
                isSpeaking ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Read aloud'}
              aria-label="Read response aloud"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse text-indigo-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 2. Reasoning & Thinking Process Banner */}
      {message.reasoningStatus && (
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/30 text-xs text-indigo-600 dark:text-indigo-300 shadow-xs animate-fade-in">
          <BrainCircuit className="w-4 h-4 animate-pulse text-indigo-500 shrink-0" />
          <span className="font-mono text-[11px] font-medium">{message.reasoningStatus}</span>
        </div>
      )}

      {/* 3. Thinking State Visualizer when stream is starting */}
      {message.isStreaming && !message.content && !message.reasoningStatus && (
        <div className="flex items-center gap-3 py-3 px-3.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] animate-fade-in">
          <AICoreOrb size="xs" state="thinking" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Nexora is processing request...</p>
            <p className="text-[11px] text-slate-400 font-mono">Synthesizing multi-modal knowledge & citations</p>
          </div>
        </div>
      )}

      {/* 3. Deterministic Tools Executed Pill */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="py-0.5">
          <button
            onClick={() => setShowTools(!showTools)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors font-mono text-[11px]"
          >
            <Wrench className="w-3 h-3 text-indigo-500" />
            <span>{message.toolCalls.length} Deterministic Tool{message.toolCalls.length > 1 ? 's' : ''} Executed</span>
            {showTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTools && (
            <div className="mt-2 space-y-1.5 pl-2.5 border-l-2 border-indigo-500/50">
              {message.toolCalls.map((tc) => (
                <div key={tc.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#15151A] border border-slate-200 dark:border-white/[0.06] text-[11px] font-mono">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>⚙️ {tc.name}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ {tc.status}</span>
                  </div>
                  <pre className="mt-1 text-slate-600 dark:text-slate-300 overflow-x-auto text-[10px]">
                    {JSON.stringify(tc.input, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Structured Semantic Markdown Content */}
      <div className="ai-response-content prose prose-slate dark:prose-invert max-w-none text-xs sm:text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Level 1 Heading - Main Document/Subject Title
            h1({ children }) {
              return (
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2.5 pb-1.5 border-b border-slate-200 dark:border-white/[0.08] flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                  <span>{children}</span>
                </h1>
              );
            },
            // Level 2 Heading - Primary Section Separator
            h2({ children }) {
              return (
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-indigo-400 rounded-full inline-block opacity-80" />
                  <span>{children}</span>
                </h2>
              );
            },
            // Level 3 Heading - Sub-sections & Components
            h3({ children }) {
              const textContent = String(children);
              // Detect step numbers like "1. Training" or "① Training"
              const stepMatch = /^([①②③④⑤⑥⑦⑧⑨⑩]|\d+\.)\s*(.*)$/.exec(textContent);
              if (stepMatch) {
                const stepNum = stepMatch[1].replace('.', '');
                return (
                  <div className="flex items-center gap-2 mt-3.5 mb-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center text-[11px] font-mono font-bold">
                      {stepNum}
                    </span>
                    <span>{stepMatch[2]}</span>
                  </div>
                );
              }

              return (
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-3 mb-1">
                  {children}
                </h3>
              );
            },
            // Level 4 Heading
            h4({ children }) {
              return (
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-2.5 mb-1">
                  {children}
                </h4>
              );
            },
            // Paragraphs - comfortable line height & controlled spacing
            p({ children }) {
              return (
                <p className="my-2 leading-[1.68] text-slate-700 dark:text-slate-200">
                  {children}
                </p>
              );
            },
            // Blockquotes & Callout Detection
            blockquote({ children }) {
              // Convert children to text to inspect for callouts
              const blockquoteContent = React.Children.toArray(children)
                .map((child: any) => {
                  if (typeof child === 'string') return child;
                  if (child?.props?.children) {
                    return typeof child.props.children === 'string'
                      ? child.props.children
                      : '';
                  }
                  return '';
                })
                .join(' ');

              const detected = detectCalloutType(blockquoteContent);
              if (detected) {
                return (
                  <CalloutBlock type={detected.type} title={detected.title}>
                    {children}
                  </CalloutBlock>
                );
              }

              return (
                <blockquote className="my-3 pl-3.5 py-1 border-l-2 border-indigo-500/60 dark:border-indigo-400/60 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-r-lg text-slate-700 dark:text-slate-300 italic">
                  {children}
                </blockquote>
              );
            },
            // Unordered List - polished bullet points
            ul({ children }) {
              return (
                <ul className="my-2.5 space-y-1.5 pl-4 list-disc marker:text-indigo-500/70 dark:marker:text-indigo-400/70">
                  {children}
                </ul>
              );
            },
            // Ordered List - sequential steps
            ol({ children }) {
              return (
                <ol className="my-2.5 space-y-1.5 pl-4 list-decimal marker:font-mono marker:font-semibold marker:text-indigo-600 dark:marker:text-indigo-400 text-xs sm:text-sm">
                  {children}
                </ol>
              );
            },
            // List item
            li({ children }) {
              return (
                <li className="leading-relaxed text-slate-700 dark:text-slate-300 pl-0.5">
                  {children}
                </li>
              );
            },
            // Strong/Bold
            strong({ children }) {
              return (
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  {children}
                </strong>
              );
            },
            // Code & Code Blocks
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children);

              // Block Code
              if (!inline && (match || codeString.includes('\n'))) {
                return (
                  <CodeBlock
                    language={match ? match[1] : 'plaintext'}
                    code={codeString}
                  />
                );
              }

              // Inline Code
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md font-mono text-[11px] sm:text-xs bg-slate-100 dark:bg-white/[0.08] text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-white/[0.08] break-words"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Tables
            table({ children }) {
              return <TableRenderer>{children}</TableRenderer>;
            },
            th({ children }) {
              return (
                <th className="px-3.5 py-2.5 bg-slate-100/90 dark:bg-[#15151C] text-left font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-white/[0.08] text-xs">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.04] text-slate-700 dark:text-slate-300 text-xs">
                  {children}
                </td>
              );
            },
            // Horizontal rule
            hr() {
              return <hr className="my-4 border-t border-slate-200 dark:border-white/[0.08]" />;
            },
            // Links
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline underline-offset-2 decoration-indigo-400/50 hover:decoration-indigo-500 font-medium inline-flex items-center gap-0.5 transition-colors"
                >
                  <span>{children}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 inline" />
                </a>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {/* Streaming pulse cursor */}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle rounded-full" />
        )}
      </div>

      {/* 5. Generated Image Showcase */}
      {message.generatedImageUrl && (
        <div className="my-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-[#0A0A0E] shadow-sm">
          <img
            src={message.generatedImageUrl}
            alt="Generated AI Art"
            className="w-full max-h-96 object-contain bg-[#07070A]"
            referrerPolicy="no-referrer"
          />
          <div className="p-2.5 bg-[#121216] border-t border-[#222228] flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">Synthesized Visual Asset</span>
            </span>
            <div className="flex items-center gap-2">
              {onEditImage && (
                <button
                  onClick={() => onEditImage(message.generatedImageUrl!, message.content)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-colors text-xs"
                  title="Transform or edit with Gemini"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Edit with Gemini</span>
                </button>
              )}
              <a
                href={message.generatedImageUrl}
                download="nexora_generated_image.png"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C22] hover:bg-[#282830] border border-[#33333E] text-slate-100 font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. Embedded Interactive Dashboard */}
      {message.dashboardData && (
        <DashboardViewer dashboard={message.dashboardData} />
      )}

      {/* 7. Embedded Interactive Report */}
      {message.reportData && (
        <ReportViewer report={message.reportData} />
      )}

      {/* 8. Interactive Grounded Citations Chips */}
      {message.citations && message.citations.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            Grounded Citations ({message.citations.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((cit, idx) => (
              <button
                key={cit.id || idx}
                onClick={() => setActiveCitation(activeCitation?.id === cit.id ? null : cit)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-[#1A1A20] hover:bg-slate-100 dark:hover:bg-[#24242C] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-[#262630] transition-colors"
              >
                <FileText className="w-3 h-3 text-indigo-500" />
                <span className="truncate max-w-[120px] font-medium">{cit.documentName}</span>
                {cit.pageNumber && <span className="text-slate-400 text-[10px]">p.{cit.pageNumber}</span>}
              </button>
            ))}
          </div>

          {/* Citation Popover Snippet Preview */}
          {activeCitation && (
            <div className="mt-2 p-3 rounded-xl bg-indigo-50/80 dark:bg-[#161620] border border-indigo-200 dark:border-indigo-900/50 text-xs space-y-1 animate-fade-in">
              <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <span>{activeCitation.documentName} {activeCitation.pageNumber ? `(Page ${activeCitation.pageNumber})` : ''}</span>
                <span className="text-[10px] font-mono text-indigo-500">Relevance: {activeCitation.score}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic">"{activeCitation.snippet}"</p>
            </div>
          )}
        </div>
      )}

      {/* 9. Bottom Actions Footer */}
      {!message.isStreaming && (
        <div className="flex items-center gap-3 pt-2 text-slate-400 dark:text-slate-500 text-xs border-t border-slate-200/40 dark:border-white/[0.04]">
          <button
            onClick={copyFullResponse}
            className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1"
              title="Regenerate response"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Retry</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-white/[0.08] pl-2">
            <button
              onClick={() => onFeedback?.(message.id, 'like')}
              className={`p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors ${
                message.userFeedback === 'like' ? 'text-emerald-500 bg-emerald-500/10' : ''
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFeedback?.(message.id, 'dislike')}
              className={`p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors ${
                message.userFeedback === 'dislike' ? 'text-rose-500 bg-rose-500/10' : ''
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AIResponse.displayName = 'AIResponse';
