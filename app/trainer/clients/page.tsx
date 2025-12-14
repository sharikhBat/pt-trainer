'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientCard } from '@/components/client-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';

interface Client {
  id: number;
  name: string;
  sessionsRemaining: number;
}

export default function ManageClientsPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchClients = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      setError(null);
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to load');
      }
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Unable to load clients');
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAdjustSessions = async (clientId: number, delta: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const newSessions = Math.max(0, client.sessionsRemaining + delta);

    // Optimistic update
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, sessionsRemaining: newSessions } : c
      )
    );

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionsRemaining: newSessions }),
      });

      if (!response.ok) {
        // Revert on error
        fetchClients();
        showToast('Failed to update sessions', 'error');
      }
    } catch (error) {
      console.error('Error updating sessions:', error);
      fetchClients();
      showToast('Failed to update sessions', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load clients"
        message="We're having trouble getting your client list. Try again in a moment."
        onRetry={fetchClients}
        onGoHome={() => router.push('/trainer/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {ToastComponent}

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <Link
            href="/trainer/dashboard"
            className="text-gray-400 text-sm hover:text-gray-300"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Clients</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-3">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No clients yet</p>
            <p className="text-sm mt-2">Add your first client to get started</p>
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              name={client.name}
              sessionsRemaining={client.sessionsRemaining}
              onAdjustSessions={(delta) => handleAdjustSessions(client.id, delta)}
            />
          ))
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#262626] px-6 py-4">
        <div className="max-w-md mx-auto">
          <Link href="/trainer/clients/add">
            <Button fullWidth>+ Add New Client</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
