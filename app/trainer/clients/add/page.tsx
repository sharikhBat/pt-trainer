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

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sessionsRemaining: parseInt(sessions) || 0,
        }),
      });

      if (response.ok) {
        showToast(`${name} added`, 'success');
        setTimeout(() => {
          router.push('/trainer/dashboard');
        }, 500);
      } else {
        showToast('Failed to add client', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      showToast('Failed to add client', 'error');
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

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Client'}
          </Button>
        </form>
      </div>
    </div>
  );
}
