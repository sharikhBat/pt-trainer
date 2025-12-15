'use client';

import { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancelAction?: boolean;
  variant?: 'default' | 'danger';
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  showCancelAction = false,
  variant = 'default',
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Prevent hydration mismatch
  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop - tap anywhere to dismiss */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      >
        {/* Hint text to tap outside */}
        <div className="absolute top-1/3 left-0 right-0 text-center">
          <span className="text-white/40 text-sm">Tap anywhere to dismiss</span>
        </div>
      </div>

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl border-t border-[#262626] p-6 pb-8 animate-slide-up">
        {/* Content */}
        <div className="max-w-md mx-auto text-center">
          {/* Subtitle first (smaller context) */}
          {subtitle && (
            <p className="text-sm text-gray-500 mb-1">
              {subtitle}
            </p>
          )}

          {/* Main question - large, clear */}
          <h2 className="text-xl font-semibold text-white mb-6">
            {title}
          </h2>

          {/* Two big action buttons */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-colors ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-500 active:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
              }`}
            >
              {confirmLabel}
            </button>

            {showCancelAction && onCancel && (
              <button
                onClick={onCancel}
                className="w-full py-4 rounded-xl bg-red-600/90 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-lg transition-colors"
              >
                {cancelLabel}
              </button>
            )}

            {/* Dismiss option */}
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 text-sm font-medium"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
