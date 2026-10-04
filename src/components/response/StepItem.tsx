import React, { memo } from 'react';

interface StepItemProps {
  number: number | string;
  title?: string;
  children: React.ReactNode;
}

export const StepItem: React.FC<StepItemProps> = memo(({
  number,
  title,
  children,
}) => {
  return (
    <div className="flex items-start gap-3 my-3 group">
      <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono shadow-xs mt-0.5 group-hover:scale-105 transition-transform">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {title}
          </h4>
        )}
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
});

StepItem.displayName = 'StepItem';
