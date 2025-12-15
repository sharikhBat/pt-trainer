'use client';

import { useState } from 'react';

interface PinModalProps {
  clientName: string;
  onVerify: (pin: string) => Promise<boolean>;
  onCancel: () => void;
  isVerifying?: boolean;
}

export function PinModal({ clientName, onVerify, onCancel, isVerifying = false }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      const isValid = await onVerify(newPin);
      if (!isValid) {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const getPinDotClass = (index: number) => {
    const base = 'w-4 h-4 rounded-full transition-all duration-150';
    if (index < pin.length) {
      return `${base} ${error ? 'bg-red-500' : 'bg-accent'}`;
    }
    return `${base} bg-[#262626]`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#141414] rounded-2xl p-6 w-full max-w-xs">
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Enter PIN
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {clientName}
        </p>

        <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={getPinDotClass(i)} />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4">
            Wrong PIN. Try again.
          </p>
        )}

        {isVerifying && (
          <p className="text-gray-400 text-center text-sm mb-4">
            Verifying...
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, index) => {
            if (key === null) {
              return <div key={index} />;
            }

            if (key === 'del') {
              return (
                <button
                  key={index}
                  onClick={handleDelete}
                  disabled={isVerifying}
                  className="h-14 rounded-2xl bg-[#262626] text-gray-500 text-xl font-medium hover:bg-[#333] active:bg-[#404040] disabled:opacity-50"
                >
                  ←
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleKeyPress(key.toString())}
                disabled={isVerifying}
                className="h-14 rounded-2xl bg-[#262626] border border-[#333] text-white text-2xl font-medium hover:bg-[#333] active:bg-[#404040] disabled:opacity-50"
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="w-full text-gray-500 text-sm py-2 hover:text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
