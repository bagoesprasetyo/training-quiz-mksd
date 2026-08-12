import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-bold uppercase tracking-wider text-slate-800"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full rounded-xl border bg-white 
            text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal
            text-sm py-2.5 transition-all duration-200 focus:outline-none 
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-blue-100 focus:border-[#0000FF] focus:ring-2 focus:ring-blue-500/20'
            }
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-semibold">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
