import React from 'react';
import { AlertTriangle, CheckCircle2, Info, RefreshCw, X, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20 justify-self-end" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#172337]/40">
      {icon && <div className="mb-3 text-slate-400 dark:text-slate-500">{icon}</div>}
      <h3 className="text-base font-semibold text-[#101827] dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load records',
  description = 'A simulated request error occurred. Retry to reload this view.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-10 px-6 border border-rose-200 dark:border-rose-900/60 rounded-xl bg-rose-50/60 dark:bg-rose-950/20"
    >
      <XCircle className="w-8 h-8 text-[#DC4C4C] mb-3" aria-hidden="true" />
      <h3 className="text-base font-semibold text-[#101827] dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" iconLeft={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export function PrototypeBanner({
  contextLabel = 'Interactive Prototype Mode — Sample automotive shop data shown. Backend telephony, billing, and calendar webhooks require server integration.',
}: {
  contextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#172337] border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
      <Info className="w-4 h-4 text-[#3978F6] shrink-0" aria-hidden="true" />
      <span>{contextLabel}</span>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#3978F6] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#E8A23A] shrink-0" />,
    error: <XCircle className="w-4 h-4 text-[#DC4C4C] shrink-0" />,
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-700 shadow-lg text-sm"
        >
          <div className="mt-0.5">{iconMap[t.variant]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#101827] dark:text-slate-100">{t.title}</p>
            {t.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
