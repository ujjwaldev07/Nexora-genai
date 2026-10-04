import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { ReportData } from '../types';
import { downloadTextFile, downloadJson, printElement } from '../lib/utils';

interface ReportViewerProps {
  report: ReportData;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const exportAsMarkdown = () => {
    let md = `# ${report.title}\n`;
    if (report.subtitle) md += `*${report.subtitle}*\n\n`;
    md += `**Date:** ${report.date} | **Author:** ${report.author || 'Aether GenAI'}\n\n---\n\n`;
    md += `## Executive Summary\n${report.executiveSummary}\n\n`;
    
    md += `## Key Findings\n`;
    report.keyFindings.forEach((f) => { md += `- ${f}\n`; });
    md += `\n`;

    report.sections.forEach((sec) => {
      md += `## ${sec.heading}\n${sec.content}\n\n`;
      if (sec.bulletPoints) {
        sec.bulletPoints.forEach((bp) => { md += `- ${bp}\n`; });
        md += `\n`;
      }
      if (sec.tableData) {
        md += `| ${sec.tableData.headers.join(' | ')} |\n`;
        md += `| ${sec.tableData.headers.map(() => '---').join(' | ')} |\n`;
        sec.tableData.rows.forEach((r) => {
          md += `| ${r.join(' | ')} |\n`;
        });
        md += `\n`;
      }
    });

    md += `## Strategic Recommendations\n`;
    report.recommendations.forEach((r) => { md += `1. ${r}\n`; });
    md += `\n## Conclusion\n${report.conclusions}\n`;

    downloadTextFile(`${report.title.toLowerCase().replace(/\s+/g, '_')}.md`, md, 'text/markdown');
  };

  return (
    <div id={`report_${report.id}`} className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden text-slate-800 dark:text-slate-200">
      {/* Report Header Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {report.title}
            </h3>
            {report.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {report.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportAsMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Download as Markdown file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => printElement(`report_${report.id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="px-6 py-2.5 bg-slate-50/40 dark:bg-slate-950/20 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{report.date}</span>
        </span>
        {report.author && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{report.author}</span>
          </span>
        )}
      </div>

      {/* Report Body */}
      <div className="p-6 space-y-6 text-sm leading-relaxed max-w-4xl">
        {/* Executive Summary */}
        <section className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Executive Summary</span>
          </h4>
          <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
            {report.executiveSummary}
          </p>
        </section>

        {/* Key Findings */}
        <section>
          <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
            Key Findings & Insights
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {report.keyFindings.map((finding, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300">{finding}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Sections */}
        {report.sections.map((sec) => (
          <section key={sec.id} className="space-y-3">
            <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
              {sec.heading}
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {sec.content}
            </p>

            {sec.bulletPoints && sec.bulletPoints.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-2">
                {sec.bulletPoints.map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
            )}

            {/* Render Data Table if present */}
            {sec.tableData && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 my-3">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      {sec.tableData.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                    {sec.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* Strategic Recommendations */}
        <section className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
            Strategic Recommendations
          </h4>
          <div className="space-y-1.5">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span className="font-bold text-emerald-600">{idx + 1}.</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Conclusion */}
        <section className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Conclusion
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {report.conclusions}
          </p>
        </section>
      </div>
    </div>
  );
};
