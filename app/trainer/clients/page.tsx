'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TrainerClientsSkeleton } from '@/components/skeletons/trainer-clients-skeleton';

interface Client {
  id: number;
  name: string;
  pin: string;
  sessionsRemaining: number;
}

export default function ManageClientsPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<number>>(new Set());

  // PIN editing state
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const [editingPinValue, setEditingPinValue] = useState('');

  // Name editing state
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Delete confirmation state
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const response = await fetch('/api/clients?includePin=true');
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

    if (pendingUpdates.has(clientId)) return;

    const previousValue = client.sessionsRemaining;
    const newSessions = Math.max(0, previousValue + delta);

    setPendingUpdates(prev => new Set([...prev, clientId]));

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
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId ? { ...c, sessionsRemaining: previousValue } : c
          )
        );
        showToast('Failed to update sessions', 'error');
      }
    } catch {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId ? { ...c, sessionsRemaining: previousValue } : c
        )
      );
      showToast('Something went wrong', 'error');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  const handleEditPin = (client: Client) => {
    setEditingPinId(client.id);
    setEditingPinValue(client.pin);
  };

  const handleSavePin = async (clientId: number) => {
    if (editingPinValue.length !== 4 || !/^\d{4}$/.test(editingPinValue)) {
      showToast('PIN must be 4 digits', 'error');
      return;
    }

    setPendingUpdates(prev => new Set([...prev, clientId]));

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: editingPinValue }),
      });

      if (response.ok) {
        setClients(prev =>
          prev.map(c => c.id === clientId ? { ...c, pin: editingPinValue } : c)
        );
        showToast('PIN updated', 'success');
        setEditingPinId(null);
        setEditingPinValue('');
      } else {
        showToast('Failed to update PIN', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  const handleCancelEditPin = () => {
    setEditingPinId(null);
    setEditingPinValue('');
  };

  const handleEditName = (client: Client) => {
    setEditingNameId(client.id);
    setEditingNameValue(client.name);
  };

  const handleSaveName = async (clientId: number) => {
    const trimmedName = editingNameValue.trim();
    if (!trimmedName) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setPendingUpdates(prev => new Set([...prev, clientId]));

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (response.ok) {
        setClients(prev =>
          prev.map(c => c.id === clientId ? { ...c, name: trimmedName } : c)
        );
        showToast('Name updated', 'success');
        setEditingNameId(null);
        setEditingNameValue('');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to update name', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditingNameValue('');
  };

  const handleDeleteClick = (client: Client) => {
    setDeleteClient(client);
  };

  const handleConfirmDelete = async () => {
    if (!deleteClient) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${deleteClient.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClients(prev => prev.filter(c => c.id !== deleteClient.id));
        showToast(`${deleteClient.name} deleted`, 'success');
        setDeleteClient(null);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete client', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteClient(null);
  };

  if (isLoading) {
    return <TrainerClientsSkeleton />;
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

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={!!deleteClient}
        onClose={handleCancelDelete}
        title={`Delete ${deleteClient?.name}?`}
        subtitle="This will remove all their bookings too"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <Link
            href="/trainer/dashboard"
            className="text-gray-400 text-sm hover:text-gray-300"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Manage Clients</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-4">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No clients yet</p>
            <p className="text-sm mt-2">Add your first client to get started</p>
          </div>
        ) : (
          clients.map((client) => {
            const isLowSessions = client.sessionsRemaining <= 3;
            const isPending = pendingUpdates.has(client.id);
            const isEditingPin = editingPinId === client.id;
            const isEditingName = editingNameId === client.id;

            return (
              <Card key={client.id} padding="md" className="space-y-3">
                {/* Name Row */}
                <div className="flex items-center justify-between">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#262626] border border-[#333] rounded text-white text-sm focus:border-accent focus:outline-none"
                        autoFocus
                        autoCapitalize="words"
                      />
                      <button
                        onClick={() => handleSaveName(client.id)}
                        disabled={isPending || !editingNameValue.trim()}
                        className="text-accent text-sm font-medium hover:text-accent-hover disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={isPending}
                        className="text-gray-500 text-sm hover:text-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-lg">{client.name}</span>
                      {isLowSessions && client.sessionsRemaining > 0 && (
                        <span className="text-accent-hover" title="Low sessions">⚠️</span>
                      )}
                      <button
                        onClick={() => handleEditName(client)}
                        className="text-gray-500 text-xs hover:text-gray-400 ml-1"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteClick(client)}
                    className="text-red-400/70 text-sm hover:text-red-400 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>

                {/* Sessions Row */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Sessions</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustSessions(client.id, -1)}
                      disabled={client.sessionsRemaining <= 0 || isPending}
                      className="w-8 h-8 rounded-full bg-[#1c1c1c] text-gray-400 font-bold
                        hover:bg-[#262626] active:bg-[#333] transition-colors border border-[#333]
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className={`w-10 text-center font-bold tabular-nums
                      ${isPending ? 'text-gray-500' : isLowSessions ? 'text-accent-hover' : 'text-gray-100'}`}>
                      {client.sessionsRemaining}
                    </span>
                    <button
                      onClick={() => handleAdjustSessions(client.id, 1)}
                      disabled={isPending}
                      className="w-8 h-8 rounded-full bg-accent/20 text-accent-hover font-bold
                        hover:bg-accent/30 active:bg-accent/40 transition-colors border border-accent/30
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* PIN Row */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">PIN</span>
                  {isEditingPin ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={editingPinValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setEditingPinValue(value);
                        }}
                        className="w-16 px-2 py-1 bg-[#262626] border border-[#333] rounded text-white text-center font-mono tracking-widest text-sm focus:border-accent focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePin(client.id)}
                        disabled={isPending || editingPinValue.length !== 4}
                        className="text-accent text-sm font-medium hover:text-accent-hover disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditPin}
                        disabled={isPending}
                        className="text-gray-500 text-sm hover:text-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-mono tracking-widest text-gray-300">{client.pin}</span>
                      <button
                        onClick={() => handleEditPin(client)}
                        className="text-accent text-sm font-medium hover:text-accent-hover"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
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
