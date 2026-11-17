import React, { useState } from 'react';

export function AreaTrendChart({
  data,
  height = 200,
  primaryLabel = 'Total Calls',
  secondaryLabel = 'AI Answered',
}: {
  data: { label: string; primary: number; secondary?: number }[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => Math.max(d.primary, d.secondary ?? 0)), 10);
  const w = 640;
  const h = height;
  const padX = 32;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const getX = (idx: number) => padX + (idx / Math.max(1, data.length - 1)) * innerW;
  const getY = (val: number) => padY + innerH - (val / maxVal) * innerH;

  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.primary)}`).join(' ');
  const areaPoints = `${getX(0)},${padY + innerH} ${primaryPoints} ${getX(data.length - 1)},${padY + innerH}`;
  const secondaryPoints = data.some((d) => d.secondary !== undefined)
    ? data.map((d, i) => `${getX(i)},${getY(d.secondary ?? 0)}`).join(' ')
    : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#3978F6] inline-block" />
            {primaryLabel}
          </span>
          {secondaryPoints && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#36C5E8] inline-block" />
              {secondaryLabel}
            </span>
          )}
        </div>
        {hoverIdx !== null && data[hoverIdx] && (
          <span className="font-mono tabular-nums text-[#101827] dark:text-slate-100">
            {data[hoverIdx].label}: {data[hoverIdx].primary}
            {data[hoverIdx].secondary !== undefined ? ` / ${data[hoverIdx].secondary} AI` : ''}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible" role="img" aria-label={primaryLabel}>
        <defs>
          <linearGradient id="tundeAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3978F6" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#3978F6" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
              <text x={0} y={y + 4} className="fill-slate-400 text-[10px] font-mono tabular-nums">
                {Math.round(maxVal * t)}
              </text>
            </g>
          );
        })}
        <polygon points={areaPoints} fill="url(#tundeAreaGrad)" />
        <polyline fill="none" stroke="#3978F6" strokeWidth="2.2" points={primaryPoints} />
        {secondaryPoints && (
          <polyline fill="none" stroke="#36C5E8" strokeWidth="2" strokeDasharray="4 3" points={secondaryPoints} />
        )}
        {data.map((d, idx) => (
          <g key={d.label} onMouseEnter={() => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(null)}>
            <circle cx={getX(idx)} cy={getY(d.primary)} r={hoverIdx === idx ? 5 : 3} fill="#3978F6" className="cursor-pointer" />
            <text x={getX(idx)} y={h - 2} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px]">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function HorizontalBarList({
  items,
  valueSuffix = '',
}: {
  items: { label: string; value: number; sublabel?: string; colorClass?: string }[];
  valueSuffix?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#101827] dark:text-slate-200 truncate">{item.label}</span>
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0 ml-2">
              {item.value}
              {valueSuffix}
              {item.sublabel ? ` · ${item.sublabel}` : ''}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.colorClass || 'bg-[#3978F6]'}`}
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerticalColumnChart({
  data,
  barColor = '#3978F6',
  secondaryColor = '#36C5E8',
}: {
  data: { label: string; value: number; secondary?: number }[];
  barColor?: string;
  secondaryColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.value + (d.secondary ?? 0)), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-40 pt-4">
      {data.map((d) => {
        const primaryPct = Math.round((d.value / max) * 100);
        const secondaryPct = d.secondary ? Math.round((d.secondary / max) * 100) : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 opacity-80 group-hover:opacity-100">
              {d.value + (d.secondary ?? 0)}
            </span>
            <div className="w-full max-w-[28px] flex flex-col justify-end h-28 bg-slate-100 dark:bg-slate-800/60 rounded-t-md overflow-hidden">
              {secondaryPct > 0 && (
                <div style={{ height: `${secondaryPct}%`, backgroundColor: secondaryColor }} className="w-full" title={`Secondary: ${d.secondary}`} />
              )}
              <div style={{ height: `${primaryPct}%`, backgroundColor: barColor }} className="w-full" title={`Primary: ${d.value}`} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
