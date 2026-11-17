import React from 'react';
import { Search, X } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, id, className = '', ...props }: InputProps) {
  const inputId = id || `input-${React.useId()}`;
  const errorId = `${inputId}-error`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[#101827] dark:text-slate-200 mb-1.5">
          {label}
          {props.required && <span className="text-[#DC4C4C] ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-[#101827] text-[#101827] dark:text-slate-100 border transition-colors ${
          error
            ? 'border-[#DC4C4C] focus:border-[#DC4C4C]'
            : 'border-slate-300 dark:border-slate-700 focus:border-[#3978F6]'
        } disabled:opacity-55 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-[#DC4C4C]" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, id, className = '', ...props }: SelectProps) {
  const selectId = id || `select-${React.useId()}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[#101827] dark:text-slate-200 mb-1.5">
          {label}
          {props.required && <span className="text-[#DC4C4C] ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={`w-full min-h-[42px] px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#101827] text-[#101827] dark:text-slate-100 border ${
          error ? 'border-[#DC4C4C]' : 'border-slate-300 dark:border-slate-700'
        } disabled:opacity-55 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-[#DC4C4C]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ label, error, helperText, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || `textarea-${React.useId()}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-[#101827] dark:text-slate-200 mb-1.5">
          {label}
          {props.required && <span className="text-[#DC4C4C] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-[#101827] text-[#101827] dark:text-slate-100 border ${
          error ? 'border-[#DC4C4C]' : 'border-slate-300 dark:border-slate-700'
        } disabled:opacity-55 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#DC4C4C]">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ariaLabel = 'Search',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full min-h-[40px] pl-9 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-[#101827] text-[#101827] dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-[#3978F6]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-[#101827] dark:text-slate-100 cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ${
          checked ? 'bg-[#3978F6]' : 'bg-slate-300 dark:bg-slate-700'
        } disabled:opacity-50`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-150 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
