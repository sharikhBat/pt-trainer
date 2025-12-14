'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 text-lg rounded-xl border border-[#262626] bg-[#141414] text-white
            placeholder:text-gray-500
            focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none
            transition-all duration-150 min-h-[52px]
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
