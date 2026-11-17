import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Tabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#101827] border border-slate-200 dark:border-slate-800 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              active
                ? 'bg-white dark:bg-[#172337] text-[#101827] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#101827] dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="tabular-nums text-[11px] text-slate-400 dark:text-slate-500">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-[#101827] dark:hover:text-slate-200 truncate">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[#101827] dark:text-slate-200 truncate">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      <span className="tabular-nums">
        Page {page} of {Math.max(1, totalPages)} · {totalItems} total
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
