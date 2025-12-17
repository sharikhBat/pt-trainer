'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function AddClientPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [name, setName] = useState('');
  const [sessions, setSessions] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAuth = useCallback(() => {
    const authData = localStorage.getItem('pt-trainer-auth');
    if (!authData) {
      router.replace('/trainer');
      return false;
    }
    const auth = JSON.parse(authData);
    if (!auth.authenticated || auth.expires <= Date.now()) {
      localStorage.removeItem('pt-trainer-auth');
      router.replace('/trainer');
      return false;
    }
    return true;
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      showToast('Please enter a 4-digit PIN', 'error');
      return;
    }

    setIsSubmitting(true);
    const clientName = name.trim();

    try {
      const sessionsCount = parseInt(sessions) || 0;
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          sessionsRemaining: sessionsCount,
          sessionsExpiresAt: sessionsCount > 0 && expiryDate ? expiryDate : null,
          pin: pin,
        }),
      });

      if (response.ok) {
        showToast(`${clientName} added`, 'success');
        // Clear form on success
        setName('');
        setSessions('');
        setExpiryDate('');
        setPin('');
        // Only redirect after confirmed success
        setTimeout(() => {
          router.push('/trainer/dashboard');
        }, 500);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to add client. Please try again.', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      showToast('Something went wrong. Please check your connection and try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {ToastComponent}

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <Link
            href="/trainer/clients"
            className="text-gray-400 text-sm hover:text-gray-300"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">
            Add New Client
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter client name"
            autoFocus
            autoCapitalize="words"
            autoComplete="off"
          />

          <Input
            label="Sessions"
            type="number"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            placeholder="Number of sessions"
            min="0"
            inputMode="numeric"
          />

          {/* Only show expiry when sessions > 0 */}
          {parseInt(sessions) > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Pack Expires (optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white focus:border-accent focus:outline-none"
              />
              <p className="text-xs text-gray-500">When should this session pack expire?</p>
            </div>
          )}

          <Input
            label="PIN (4 digits)"
            type="text"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(value);
            }}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isSubmitting || !name.trim() || pin.length !== 4}
          >
            {isSubmitting ? 'Saving...' : 'Save Client'}
          </Button>
        </form>
      </div>
    </div>
  );
}
