import React from 'react';
import { AlertCircle, CheckCircle2, Clock, MinusCircle, ShieldAlert } from 'lucide-react';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function StatusBadge({
  label,
  tone = 'neutral',
  showIcon = true,
}: {
  label: string;
  tone?: BadgeTone;
  showIcon?: boolean;
}) {
  const styles: Record<BadgeTone, string> = {
    success:
      'text-[#128054] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70',
    warning:
      'text-[#A16207] dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70',
    error:
      'text-[#B91C1C] dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/70',
    info:
      'text-[#1D4ED8] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/70',
    neutral:
      'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  const iconMap: Record<BadgeTone, React.ReactNode> = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    warning: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    error: <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    info: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    neutral: <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${styles[tone]}`}
    >
      {showIcon && iconMap[tone]}
      <span>{label}</span>
    </span>
  );
}
