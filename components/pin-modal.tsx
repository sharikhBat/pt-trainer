'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface PinModalProps {
  clientName: string;
  onVerify: (pin: string) => Promise<boolean>;
  onCancel: () => void;
  isVerifying?: boolean;
}

export function PinModal({ clientName, onVerify, onCancel, isVerifying = false }: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullPin?: string) => {
    const pinToVerify = fullPin || pin.join('');
    if (pinToVerify.length !== 4) {
      setError('Please enter 4 digits');
      return;
    }

    const isValid = await onVerify(pinToVerify);
    if (!isValid) {
      setError('Wrong PIN');
      setShake(true);
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className={`bg-[#141414] rounded-2xl p-6 w-full max-w-sm ${shake ? 'animate-shake' : ''}`}>
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Enter PIN
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {clientName}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              className="w-14 h-14 text-center text-2xl font-bold bg-[#262626] border-2 border-[#333] rounded-xl text-white focus:border-accent focus:outline-none disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => handleSubmit()}
            disabled={pin.join('').length !== 4 || isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Continue'}
          </Button>
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
