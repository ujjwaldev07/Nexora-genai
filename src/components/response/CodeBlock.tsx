import React, { useState, useMemo, memo } from 'react';
import { 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  FileCode, 
  CheckCheck,
  WrapText
} from 'lucide-react';
import { highlightCode } from '../../lib/prismHighlight';

interface CodeBlockProps {
  language?: string;
  code: string;
  filename?: string;
}

const langIcons: Record<string, string> = {
  python: '🐍',
  py: '🐍',
  javascript: '⚡',
  js: '⚡',
  typescript: '🔷',
  ts: '🔷',
  tsx: '⚛️',
  jsx: '⚛️',
  bash: '🐚',
  sh: '🐚',
  shell: '🐚',
  zsh: '🐚',
  terminal: '💻',
  json: '📋',
  sql: '🗄️',
  html: '🌐',
  css: '🎨',
  rust: '🦀',
  go: '🐹',
  cpp: '⚙️',
  c: '⚙️',
  csharp: '🎯',
  java: '☕',
  yaml: '📑',
  dockerfile: '🐳',
  docker: '🐳',
  latex: '📐',
  math: '∑',
};

export const CodeBlock: React.FC<CodeBlockProps> = memo(({
  language = 'plaintext',
  code,
  filename,
}) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const cleanCode = useMemo(() => code.replace(/\n$/, ''), [code]);
  const langKey = (language || '').toLowerCase().trim();
  const isTerminal = ['bash', 'sh', 'shell', 'zsh', 'terminal'].includes(langKey);

  const highlightedHtml = useMemo(() => {
    return highlightCode(cleanCode, langKey);
  }, [cleanCode, langKey]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = useMemo(() => {
    return cleanCode.split('\n').length;
  }, [cleanCode]);

  return (
    <div className="group relative my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.09] bg-[#0C0C10] shadow-md shadow-black/20 text-slate-100 transition-all">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#14141A] border-b border-slate-200/20 dark:border-white/[0.07] text-xs select-none">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
          <span className="text-sm">
            {langIcons[langKey] || (isTerminal ? <Terminal className="w-3.5 h-3.5 text-indigo-400" /> : <Code2 className="w-3.5 h-3.5 text-indigo-400" />)}
          </span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px]">
            {filename || language || 'code'}
          </span>
          {lineCount > 1 && (
            <span className="text-[10px] text-slate-500 font-normal">
              ({lineCount} lines)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={`p-1 rounded-md transition-colors ${
              wrapLines 
                ? 'bg-indigo-500/20 text-indigo-300' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title={wrapLines ? 'Disable word wrap' : 'Enable word wrap'}
            aria-label="Toggle word wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/[0.08] transition-colors focus:outline-none"
            title="Copy snippet"
            aria-label="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-200" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Pre Area */}
      <div className="relative">
        <pre 
          className={`p-3.5 sm:p-4 text-xs font-mono leading-relaxed overflow-x-auto text-slate-100 bg-[#09090D] ${
            wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          }`}
        >
          <code 
            className={`language-${langKey}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
