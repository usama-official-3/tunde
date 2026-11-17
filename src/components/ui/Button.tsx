import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3978F6]';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#3978F6] text-white hover:bg-[#2963DB] active:bg-[#2253BC] border border-transparent',
    secondary:
      'bg-[#101827] text-white hover:bg-[#172337] dark:bg-slate-100 dark:text-[#101827] dark:hover:bg-white border border-transparent',
    outline:
      'bg-white dark:bg-[#172337] text-[#101827] dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
    ghost:
      'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent',
    danger:
      'bg-[#DC4C4C] text-white hover:bg-[#C33B3B] border border-transparent',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs px-3 py-2 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[40px]',
    lg: 'text-sm px-5 py-2.5 min-h-[44px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}
