import React, { memo } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  AlertOctagon, 
  Bookmark, 
  Sparkles,
  Zap
} from 'lucide-react';

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'success' | 'takeaway';

interface CalloutBlockProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig: Record<CalloutType, {
  icon: React.ElementType;
  label: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  note: {
    icon: Info,
    label: 'Note',
    borderColor: 'border-blue-500/30 dark:border-blue-500/25',
    bgColor: 'bg-blue-500/[0.05] dark:bg-blue-500/[0.08]',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    borderColor: 'border-amber-500/35 dark:border-amber-500/30',
    bgColor: 'bg-amber-500/[0.06] dark:bg-amber-500/[0.09]',
    textColor: 'text-amber-950 dark:text-amber-100',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  takeaway: {
    icon: Sparkles,
    label: 'Key Takeaway',
    borderColor: 'border-indigo-500/35 dark:border-indigo-500/30',
    bgColor: 'bg-indigo-500/[0.06] dark:bg-indigo-500/[0.09]',
    textColor: 'text-indigo-950 dark:text-indigo-100',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  important: {
    icon: Bookmark,
    label: 'Important',
    borderColor: 'border-purple-500/35 dark:border-purple-500/30',
    bgColor: 'bg-purple-500/[0.06] dark:bg-purple-500/[0.09]',
    textColor: 'text-purple-950 dark:text-purple-100',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    borderColor: 'border-orange-500/35 dark:border-orange-500/30',
    bgColor: 'bg-orange-500/[0.06] dark:bg-orange-500/[0.09]',
    textColor: 'text-orange-950 dark:text-orange-100',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  caution: {
    icon: AlertOctagon,
    label: 'Caution',
    borderColor: 'border-rose-500/35 dark:border-rose-500/30',
    bgColor: 'bg-rose-500/[0.06] dark:bg-rose-500/[0.09]',
    textColor: 'text-rose-950 dark:text-rose-100',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  success: {
    icon: CheckCircle2,
    label: 'Success',
    borderColor: 'border-emerald-500/35 dark:border-emerald-500/30',
    bgColor: 'bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09]',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
};

export function detectCalloutType(text: string): { type: CalloutType; title?: string; cleanContent: string } | null {
  if (!text) return null;
  const trimmed = text.trim();

  // GitHub style callout: [!NOTE], [!TIP], [!WARNING], [!IMPORTANT], [!CAUTION]
  const ghMatch = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS)\]\s*(.*)$/im.exec(trimmed);
  if (ghMatch) {
    const rawType = ghMatch[1].toLowerCase() as CalloutType;
    const remaining = trimmed.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS)\]\s*/i, '');
    return {
      type: rawType,
      title: ghMatch[1].charAt(0).toUpperCase() + ghMatch[1].slice(1).toLowerCase(),
      cleanContent: remaining,
    };
  }

  // Emoji / Text keyword prefix: 💡 Tip:, 💡 Key takeaway:, ⚠️ Warning:, ℹ️ Note:, etc.
  const prefixMatch = /^(💡|⚠️|ℹ️|📌|✅|🔥)?\s*(Tip|Key takeaway|Takeaway|Important|Warning|Note|Caution|Notice|Success):\s*(.*)$/i.exec(trimmed);
  if (prefixMatch) {
    const keyword = prefixMatch[2].toLowerCase();
    let type: CalloutType = 'note';
    if (keyword.includes('tip')) type = 'tip';
    else if (keyword.includes('takeaway')) type = 'takeaway';
    else if (keyword.includes('important')) type = 'important';
    else if (keyword.includes('warning')) type = 'warning';
    else if (keyword.includes('caution')) type = 'caution';
    else if (keyword.includes('success')) type = 'success';

    return {
      type,
      title: prefixMatch[2],
      cleanContent: prefixMatch[3] || '',
    };
  }

  return null;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = memo(({
  type = 'note',
  title,
  children,
}) => {
  const config = calloutConfig[type] || calloutConfig.note;
  const IconComponent = config.icon;

  return (
    <div className={`my-4 p-3.5 sm:p-4 rounded-xl border ${config.borderColor} ${config.bgColor} backdrop-blur-sm shadow-xs transition-all`}>
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5">
          <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-xs mb-1 ${config.textColor}`}>
            {title || config.label}
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

CalloutBlock.displayName = 'CalloutBlock';
