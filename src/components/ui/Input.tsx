/**
 * QR Café UI Library — Input
 * Standard dark-themed form input with error and hint states.
 */

import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-white border rounded-xl px-3 py-2.5 text-xs text-stone-800
              placeholder-stone-400 transition-colors outline-none shadow-sm
              focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-stone-200"}
              ${leftIcon ? "pl-9" : ""}
              ${rightIcon ? "pr-9" : ""}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-[10px] text-red-400 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[10px] text-stone-500">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

/**
 * Textarea variant
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full bg-white border rounded-xl px-3 py-2.5 text-xs text-stone-800
            placeholder-stone-400 transition-colors outline-none resize-none shadow-sm
            focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20
            disabled:opacity-50
            ${error ? "border-rose-400" : "border-stone-200"}
            ${className}
          `}
          {...props}
        />

        {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
        {hint && !error && <p className="text-[10px] text-stone-500">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

