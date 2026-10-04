import React, { useState, useRef, memo } from 'react';
import { Copy, Check, Table as TableIcon } from 'lucide-react';

interface TableRendererProps {
  children: React.ReactNode;
}

export const TableRenderer: React.FC<TableRendererProps> = memo(({ children }) => {
  const [copied, setCopied] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const copyTableAsText = () => {
    if (!tableContainerRef.current) return;
    const tableEl = tableContainerRef.current.querySelector('table');
    if (!tableEl) return;

    // Convert HTML table to Markdown format
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const mdRows = rows.map((row, idx) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const textCells = cells.map(c => c.textContent?.trim() || '');
      const line = `| ${textCells.join(' | ')} |`;
      if (idx === 0) {
        const divider = `| ${cells.map(() => '---').join(' | ')} |`;
        return `${line}\n${divider}`;
      }
      return line;
    });

    navigator.clipboard.writeText(mdRows.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-slate-50/50 dark:bg-[#0D0D12] shadow-xs">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 dark:bg-[#141419] border-b border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-700 dark:text-slate-300">
            Data Table
          </span>
        </div>
        <button
          onClick={copyTableAsText}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
          title="Copy table as Markdown"
        >
          {copied ? (
            <>
              <Check className="w-2.5 h-2.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-2.5 h-2.5 text-slate-400" />
              <span>Copy Table</span>
            </>
          )}
        </button>
      </div>

      {/* Scrollable Table Area */}
      <div ref={tableContainerRef} className="overflow-x-auto max-w-full">
        <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200 dark:divide-white/[0.06]">
          {children}
        </table>
      </div>
    </div>
  );
});

TableRenderer.displayName = 'TableRenderer';
