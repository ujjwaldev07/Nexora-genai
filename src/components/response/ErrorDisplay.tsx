import React, { useState, memo } from 'react';
import { AlertCircle, RotateCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = memo(({ error, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyError = () => {
    navigator.clipboard.writeText(error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 p-3.5 sm:p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-rose-900 dark:text-rose-200 text-xs shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-rose-950 dark:text-rose-100 text-xs sm:text-sm">
              Unable to generate complete response
            </h4>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-xs">
              The request could not be fulfilled. You can try regenerating or reviewing the technical details.
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shrink-0 shadow-xs"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>

      <div className="pt-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline"
        >
          <span>{showDetails ? 'Hide technical logs' : 'Show technical logs'}</span>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300 font-mono text-[10px] relative group">
            <div className="flex justify-end mb-1">
              <button
                onClick={copyError}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-[10px] text-slate-300 transition-colors"
                title="Copy error details"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';
