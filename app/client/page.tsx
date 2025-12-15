'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientCard } from '@/components/client-card';
import { PinModal } from '@/components/pin-modal';
import { ErrorState } from '@/components/ui/error-state';
import { ClientSelectionSkeleton } from '@/components/skeletons/client-selection-skeleton';

interface Client {
  id: number;
  name: string;
  sessionsRemaining: number;
}

interface ClientSession {
  clientId: number;
  clientName: string;
  verified: boolean;
  timestamp: number;
}

export default function ClientSelection() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check for existing session on mount
  const checkExistingSession = useCallback(() => {
    const sessionData = localStorage.getItem('pt-client-session');
    if (sessionData) {
      try {
        const session: ClientSession = JSON.parse(sessionData);
        // Session valid for 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (session.verified && session.timestamp > Date.now() - thirtyDays) {
          router.replace(`/client/${session.clientId}`);
          return true;
        } else {
          // Session expired, clear it
          localStorage.removeItem('pt-client-session');
        }
      } catch {
        localStorage.removeItem('pt-client-session');
      }
    }
    return false;
  }, [router]);

  useEffect(() => {
    const hasSession = checkExistingSession();
    if (!hasSession) {
      fetchClients();
    }
  }, [checkExistingSession]);

  const fetchClients = async () => {
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
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleVerifyPin = async (pin: string): Promise<boolean> => {
    if (!selectedClient) return false;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/clients/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, pin }),
      });

      if (response.ok) {
        // Save session to localStorage
        const session: ClientSession = {
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          verified: true,
          timestamp: Date.now(),
        };
        localStorage.setItem('pt-client-session', JSON.stringify(session));
        localStorage.setItem('pt-client-id', selectedClient.id.toString());

        router.push(`/client/${selectedClient.id}`);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelPin = () => {
    setSelectedClient(null);
  };

  const handleBack = () => {
    localStorage.removeItem('pt-user-type');
    localStorage.removeItem('pt-client-id');
    localStorage.removeItem('pt-client-session');
    router.push('/');
  };

  if (isLoading) {
    return <ClientSelectionSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your info"
        message="We're having trouble connecting. Check your internet and try again."
        onRetry={fetchClients}
        onGoHome={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {selectedClient && (
        <PinModal
          clientName={selectedClient.name}
          onVerify={handleVerifyPin}
          onCancel={handleCancelPin}
          isVerifying={isVerifying}
        />
      )}

      <div className="max-w-md mx-auto">
        <button
          onClick={handleBack}
          className="text-gray-500 text-sm mb-4 hover:text-gray-400"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">
          Select Your Name
        </h1>

        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No clients registered yet</p>
            <p className="text-sm mt-2">Ask your trainer to add you</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                name={client.name}
                sessionsRemaining={client.sessionsRemaining}
                onClick={() => handleSelectClient(client)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
