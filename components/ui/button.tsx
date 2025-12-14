'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] uppercase tracking-wide';

    const variants = {
      primary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent shadow-lg shadow-accent/20 hover:shadow-accent/30',
      secondary: 'bg-[#1c1c1c] text-gray-200 hover:bg-[#262626] focus:ring-gray-500 border border-[#333]',
      ghost: 'bg-transparent text-gray-400 hover:bg-[#141414] focus:ring-gray-500',
      danger: 'bg-[#2d1f1f] text-red-400 hover:bg-[#3d2525] focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[52px]',
      xl: 'px-8 py-6 text-xl min-h-[64px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
