import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'filled';
  floatingLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      floatingLabel = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(
      !!props.value || !!props.defaultValue
    );

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const baseInputClass = cn(
      'w-full rounded-lg text-sm text-white placeholder:text-slate-500 transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'bg-[#0a1628] border border-border hover:border-slate-600': variant === 'default',
        'bg-transparent border-b border-border rounded-none': variant === 'ghost',
        'bg-surface border border-transparent focus:border-cyan-500/40': variant === 'filled',
        'border-red-500/60 focus:ring-red-500/30 focus:border-red-500/60': !!error,
      },
      leftIcon ? 'pl-10' : 'pl-3.5',
      rightIcon ? 'pr-10' : 'pr-3.5',
      floatingLabel ? 'pt-5 pb-2' : 'py-2.5',
      className
    );

    if (floatingLabel && label) {
      return (
        <div className="relative w-full">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={baseInputClass}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-3.5 transition-all duration-200 pointer-events-none select-none',
              focused || hasValue
                ? 'top-1.5 text-[10px] font-medium text-cyan-400'
                : 'top-3 text-sm text-slate-500'
            )}
          >
            {label}
          </label>
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          )}
          {error && (
            <p id={`${inputId}-error`} className="mt-1 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={baseInputClass}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block mb-1.5 text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-slate-500',
            'bg-[#0a1628] border transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500/60 focus:ring-red-500/30'
              : 'border-border hover:border-slate-600',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">⚠ {error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
