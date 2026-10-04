import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Printer, 
  Sparkles, 
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { DashboardData } from '../types';
import { downloadJson, printElement } from '../lib/utils';

interface DashboardViewerProps {
  dashboard: DashboardData;
  onClose?: () => void;
}

const PALETTE = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const DashboardViewer: React.FC<DashboardViewerProps> = ({ dashboard, onClose }) => {
  const [selectedChartIndex, setSelectedChartIndex] = useState<number>(0);

  const activeChart = useMemo(() => {
    return dashboard.charts[selectedChartIndex] || dashboard.charts[0];
  }, [dashboard.charts, selectedChartIndex]);

  const customTooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '12px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    padding: '8px 12px',
  };

  return (
    <div id={`dashboard_${dashboard.id}`} className="my-4 rounded-xl border border-slate-200 dark:border-[#26262F] bg-white dark:bg-[#131317] shadow-sm overflow-hidden animate-fade-in">
      {/* Dashboard Header Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-[#26262F] flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#18181E]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
              {dashboard.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {dashboard.summary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadJson(`${dashboard.title.toLowerCase().replace(/\s+/g, '_')}_dashboard.json`, dashboard)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#202028] hover:bg-slate-100 dark:hover:bg-[#2A2A35] border border-slate-200 dark:border-[#2C2C38] text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            title="Download Dashboard JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => printElement(`dashboard_${dashboard.id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#202028] hover:bg-slate-100 dark:hover:bg-[#2A2A35] border border-slate-200 dark:border-[#2C2C38] text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/40 dark:bg-[#111115] border-b border-slate-200 dark:border-[#26262F]">
        {dashboard.kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white dark:bg-[#18181F] border border-slate-200/80 dark:border-[#262632] shadow-2xs transition-all hover:border-indigo-500/30"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span className="truncate pr-1">{kpi.title}</span>
              {kpi.change && (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    kpi.isPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40'
                  }`}
                >
                  {kpi.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {kpi.change}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono tracking-tight">
              {kpi.value}
            </div>
            {kpi.description && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                {kpi.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      {dashboard.charts.length > 0 && (
        <div className="p-4 space-y-3">
          {/* Chart Selection Tabs */}
          {dashboard.charts.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {dashboard.charts.map((ch, idx) => (
                <button
                  key={ch.id || idx}
                  onClick={() => setSelectedChartIndex(idx)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    selectedChartIndex === idx
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1A1A22] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252530] border border-slate-200/60 dark:border-[#282835]'
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          )}

          {/* Active Chart Box */}
          {activeChart && (
            <div className="rounded-xl border border-slate-200 dark:border-[#262632] p-4 bg-slate-50/50 dark:bg-[#16161D]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeChart.title}
                  </h4>
                  {activeChart.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeChart.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Chart Rendering Container */}
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(activeChart)}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights & Strategic Recommendations */}
      <div className="p-4 bg-slate-50/60 dark:bg-[#141419] border-t border-slate-200 dark:border-[#26262F] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h5 className="font-semibold text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Key Synthesized Insights</span>
          </h5>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
            {dashboard.insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-semibold text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Strategic Recommendations</span>
          </h5>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
            {dashboard.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  function renderChart(chart: any) {
    if (chart.type === 'bar') {
      return (
        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
          <XAxis dataKey={chart.dataKeyX} stroke="#888888" fontSize={10} tickLine={false} />
          <YAxis stroke="#888888" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          {chart.series.map((s: any, idx: number) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || PALETTE[idx % PALETTE.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    if (chart.type === 'line') {
      return (
        <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
          <XAxis dataKey={chart.dataKeyX} stroke="#888888" fontSize={10} tickLine={false} />
          <YAxis stroke="#888888" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          {chart.series.map((s: any, idx: number) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || PALETTE[idx % PALETTE.length]}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: s.color || PALETTE[idx % PALETTE.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      );
    }

    if (chart.type === 'pie') {
      const primaryKey = chart.series[0]?.key || Object.keys(chart.data[0] || {})[1];
      return (
        <PieChart>
          <Tooltip contentStyle={customTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Pie
            data={chart.data}
            dataKey={primaryKey}
            nameKey={chart.dataKeyX}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={42}
            paddingAngle={3}
          >
            {chart.data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    // Area Chart Default
    return (
      <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
        <XAxis dataKey={chart.dataKeyX} stroke="#888888" fontSize={10} tickLine={false} />
        <YAxis stroke="#888888" fontSize={10} tickLine={false} />
        <Tooltip contentStyle={customTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        {chart.series.map((s: any, idx: number) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color || '#4f46e5'}
            fillOpacity={1}
            fill="url(#dashAreaGrad)"
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    );
  }
};
