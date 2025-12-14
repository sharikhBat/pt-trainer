'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClientCard } from '@/components/client-card';
import { ErrorState } from '@/components/ui/error-state';

interface Client {
  id: number;
  name: string;
  sessionsRemaining: number;
}

export default function ClientSelection() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

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
    localStorage.setItem('pt-client-id', client.id.toString());
    router.push(`/client/${client.id}`);
  };

  const handleBack = () => {
    localStorage.removeItem('pt-user-type');
    localStorage.removeItem('pt-client-id');
    router.push('/');
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
        title="Couldn't load your info"
        message="We're having trouble connecting. Check your internet and try again."
        onRetry={fetchClients}
        onGoHome={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
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
