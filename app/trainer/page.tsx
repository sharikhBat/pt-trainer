'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TRAINER_PIN = process.env.NEXT_PUBLIC_TRAINER_PIN || '1234';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getExpiryTime() {
  return Date.now() + SEVEN_DAYS_MS;
}

function isAuthValid(authData: string | null): boolean {
  if (!authData) return false;
  try {
    const auth = JSON.parse(authData);
    return auth.authenticated && auth.expires > Date.now();
  } catch {
    return false;
  }
}

export default function TrainerPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('pt-trainer-auth');
    if (isAuthValid(authData)) {
      router.replace('/trainer/dashboard');
    }
  }, [router]);

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === TRAINER_PIN) {
        const authPayload = {
          authenticated: true,
          expires: getExpiryTime(),
        };
        localStorage.setItem('pt-trainer-auth', JSON.stringify(authPayload));
        router.push('/trainer/dashboard');
      } else {
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
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleBack = () => {
    localStorage.removeItem('pt-user-type');
    router.push('/');
  };

  const getPinDotClass = (index: number) => {
    const base = 'w-4 h-4 rounded-full transition-all duration-150';
    if (index < pin.length) {
      return `${base} ${error ? 'bg-red-500' : 'bg-accent'}`;
    }
    return `${base} bg-[#262626]`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <button
          onClick={handleBack}
          className="text-gray-500 text-sm mb-8 hover:text-gray-400"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Trainer Access
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Enter your PIN
        </p>

        <div className={`flex justify-center gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={getPinDotClass(i)} />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4">
            Wrong PIN. Try again.
          </p>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, index) => {
            if (key === null) {
              return <div key={index} />;
            }

            if (key === 'del') {
              return (
                <button
                  key={index}
                  onClick={handleDelete}
                  className="h-16 rounded-2xl bg-[#141414] text-gray-500 text-xl font-medium hover:bg-[#1c1c1c] active:bg-[#262626]"
                >
                  ←
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleKeyPress(key.toString())}
                className="h-16 rounded-2xl bg-[#141414] border border-[#262626] text-white text-2xl font-medium hover:bg-[#1c1c1c] active:bg-[#262626]"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
