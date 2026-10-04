import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Upload, 
  Sparkles, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  X, 
  Table,
  Search,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { dataAnalyzer, DatasetAnalysisResult } from '../lib/ai/dataAnalyzer';
import { DashboardData, ReportData } from '../types';

interface DataStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendDashboardToChat: (dashboard: DashboardData) => void;
  onSendReportToChat: (report: ReportData) => void;
}

const SAMPLE_CSV = `Month,Revenue,Expenses,New_Users,Churn_Rate,Region
Jan,125000,84000,1420,2.1,North America
Feb,138000,89000,1650,1.9,North America
Mar,152000,94000,1890,1.8,Europe
Apr,148000,96000,1780,2.2,Asia Pacific
May,164000,102000,2100,1.6,North America
Jun,182000,108000,2450,1.4,Europe
Jul,195000,115000,2700,1.3,North America
Aug,210000,122000,2950,1.2,Asia Pacific
Sep,205000,126000,2850,1.5,Europe
Oct,228000,134000,3200,1.1,North America
Nov,245000,142000,3500,1.0,Europe
Dec,270000,150000,3900,0.9,North America`;

export const DataStudioModal: React.FC<DataStudioModalProps> = ({
  isOpen,
  onClose,
  onSendDashboardToChat,
  onSendReportToChat,
}) => {
  const [csvContent, setCsvContent] = useState<string>(SAMPLE_CSV);
  const [datasetName, setDatasetName] = useState<string>('Quarterly_Financials.csv');
  const [analysis, setAnalysis] = useState<DatasetAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preview' | 'correlations'>('profile');
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  if (!isOpen) return null;

  const handleAnalyze = () => {
    if (!csvContent.trim()) return;
    const records = dataAnalyzer.parseCSV(csvContent);
    const result = dataAnalyzer.analyze(records, datasetName);
    setAnalysis(result);
    setPage(1);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setDatasetName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      const records = dataAnalyzer.parseCSV(text);
      const result = dataAnalyzer.analyze(records, file.name);
      setAnalysis(result);
      setPage(1);
    };
    reader.readAsText(file);
  };

  const generateAndSendDashboard = () => {
    if (!analysis) return;
    const dash = dataAnalyzer.generateDashboard(analysis, `Executive Intelligence: ${datasetName}`);
    onSendDashboardToChat(dash);
    onClose();
  };

  const generateAndSendReport = () => {
    if (!analysis) return;
    const rep = dataAnalyzer.generateReport(analysis, `Quantitative Report: ${datasetName}`);
    onSendReportToChat(rep);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-[#282834] bg-white dark:bg-[#121217] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#262632] flex items-center justify-between bg-slate-50/80 dark:bg-[#16161D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Nexora Data Studio & Statistical Pipeline</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                  Real-Time Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload CSV or tabular data for instant variance profiling, anomaly detection, and 1-click analytical dashboards.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Upload & CSV Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Raw CSV Records
                </label>
                <button
                  onClick={() => {
                    setCsvContent(SAMPLE_CSV);
                    setDatasetName('Quarterly_Financials.csv');
                    const records = dataAnalyzer.parseCSV(SAMPLE_CSV);
                    setAnalysis(dataAnalyzer.analyze(records, 'Quarterly_Financials.csv'));
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-xs flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Load Sample Financials</span>
                </button>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste CSV text with column headers here..."
                rows={4}
                className="w-full p-2.5 font-mono text-[11px] rounded-xl bg-slate-50 dark:bg-[#181820] border border-slate-200 dark:border-[#262632] focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
              />
            </div>

            {/* Drop / Browse Area */}
            <div className="flex flex-col justify-between p-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-[#2A2A38] bg-slate-50/50 dark:bg-[#16161E]/50 text-center">
              <div className="my-auto space-y-1">
                <Upload className="w-5 h-5 text-indigo-500 mx-auto" />
                <div className="font-semibold text-slate-700 dark:text-slate-200 text-xs">Import Dataset File</div>
                <div className="text-[10px] text-slate-400">Supports .csv, .tsv, .txt</div>
              </div>
              <label className="mt-2 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer transition-colors text-center shadow-xs">
                Browse Files
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400 font-mono">
              Active: <span className="text-slate-700 dark:text-slate-300 font-medium">{datasetName}</span>
            </span>
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compute Statistical Profile</span>
            </button>
          </div>

          {/* Analysis View */}
          {analysis && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-[#262632]">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181822] border border-slate-200/80 dark:border-[#262634]">
                  <div className="text-slate-400 text-[11px]">Records Evaluated</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {analysis.rowCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181822] border border-slate-200/80 dark:border-[#262634]">
                  <div className="text-slate-400 text-[11px]">Total Dimensions</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {analysis.columnCount} Attributes
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181822] border border-slate-200/80 dark:border-[#262634]">
                  <div className="text-slate-400 text-[11px]">Numeric Metrics</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {analysis.numericColumns.length} Continuous
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181822] border border-slate-200/80 dark:border-[#262634]">
                  <div className="text-slate-400 text-[11px]">Anomalies Detected</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    {analysis.anomalies.length} Outlier(s)
                  </div>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#262632] pb-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E1E28]'
                  }`}
                >
                  Attribute Profiles & Stats
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E1E28]'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabular Data Preview</span>
                </button>
                {analysis.correlations && analysis.correlations.length > 0 && (
                  <button
                    onClick={() => setActiveTab('correlations')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'correlations'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E1E28]'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Correlations ({analysis.correlations.length})</span>
                  </button>
                )}
              </div>

              {/* Tab: Column Profiles */}
              {activeTab === 'profile' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#262632]">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-[#262632] text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#16161E] font-semibold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="px-3.5 py-2.5">Attribute Name</th>
                        <th className="px-3.5 py-2.5">Type</th>
                        <th className="px-3.5 py-2.5">Distinct</th>
                        <th className="px-3.5 py-2.5">Mean (Avg)</th>
                        <th className="px-3.5 py-2.5">Median</th>
                        <th className="px-3.5 py-2.5">Range (Min - Max)</th>
                        <th className="px-3.5 py-2.5">Std Dev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-[#262632]">
                      {analysis.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#181822]">
                          <td className="px-3.5 py-2 font-medium text-slate-800 dark:text-slate-200">{col.name}</td>
                          <td className="px-3.5 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40">
                              {col.type}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-slate-500 font-mono">{col.uniqueCount}</td>
                          <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300">
                            {col.stats ? col.stats.mean.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300">
                            {col.stats ? col.stats.median.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-600 dark:text-slate-400">
                            {col.stats ? `${col.stats.min} – ${col.stats.max}` : '—'}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-600 dark:text-slate-400">
                            {col.stats ? col.stats.stdDev.toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Tabular Data Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Search records..."
                        className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#181820] border border-slate-200 dark:border-[#262632] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Showing page {page} of {Math.max(1, Math.ceil(analysis.data.length / pageSize))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#262632]">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-[#262632] text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#16161E] font-semibold text-slate-600 dark:text-slate-300">
                        <tr>
                          {analysis.columns.map((c) => (
                            <th key={c.name} className="px-3.5 py-2">{c.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-[#262632]">
                        {analysis.data
                          .filter((row) =>
                            Object.values(row).some((val) =>
                              String(val).toLowerCase().includes(tableSearch.toLowerCase())
                            )
                          )
                          .slice((page - 1) * pageSize, page * pageSize)
                          .map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-[#181822]">
                              {analysis.columns.map((c) => (
                                <td key={c.name} className="px-3.5 py-2 text-slate-700 dark:text-slate-300 font-mono">
                                  {String(row[c.name] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-[#1C1C26] text-slate-600 dark:text-slate-400 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(analysis.data.length / pageSize), p + 1))}
                      disabled={page >= Math.ceil(analysis.data.length / pageSize)}
                      className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-[#1C1C26] text-slate-600 dark:text-slate-400 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Correlations */}
              {activeTab === 'correlations' && analysis.correlations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.correlations.map((corr, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181822] border border-slate-200 dark:border-[#262634] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {corr.col1} ↔ {corr.col2}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                            corr.coefficient > 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          r = {corr.coefficient}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {corr.coefficient > 0
                          ? `Strong positive linear relationship: as ${corr.col1} increases, ${corr.col2} tends to scale upwards.`
                          : `Inverse relationship: as ${corr.col1} increases, ${corr.col2} decreases.`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-[#262632] bg-slate-50/80 dark:bg-[#16161D] flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {analysis ? 'Deterministic statistical model ready.' : 'Load or upload dataset to begin.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateAndSendReport}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#20202A] hover:bg-slate-100 dark:hover:bg-[#2A2A36] border border-slate-200 dark:border-[#2C2C3C] text-slate-700 dark:text-slate-200 font-medium disabled:opacity-50 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Send Executive Report</span>
            </button>
            <button
              onClick={generateAndSendDashboard}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 shadow-xs transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Send Live Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
