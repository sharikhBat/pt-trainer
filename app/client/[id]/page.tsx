'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SlotPicker } from '@/components/slot-picker';
import { SessionList } from '@/components/session-list';
import { useToast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';

interface Client {
  id: number;
  name: string;
  sessionsRemaining: number;
}

interface Booking {
  id: number;
  datetime: string;
}

interface Availability {
  date: string;
  slots: string[];
}

export default function ClientBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.id as string;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [clientRes, bookingsRes, availabilityRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/bookings?clientId=${clientId}`),
        fetch('/api/availability'),
      ]);

      if (!clientRes.ok) {
        // Client not found, redirect to selection
        localStorage.removeItem('pt-client-id');
        router.replace('/client');
        return;
      }

      if (!bookingsRes.ok || !availabilityRes.ok) {
        throw new Error('Failed to load data');
      }

      const [clientData, bookingsData, availabilityData] = await Promise.all([
        clientRes.json(),
        bookingsRes.json(),
        availabilityRes.json(),
      ]);

      setClient(clientData);
      setBookings(bookingsData);
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load your booking information');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBookSlot = async (date: string, time: string) => {
    if (!client || isBooking) return;

    setIsBooking(true);

    try {
      const datetime = new Date(`${date}T${time}:00`);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, datetime: datetime.toISOString() }),
      });

      if (response.ok) {
        const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' });
        const timeStr = datetime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        showToast(`Booked for ${dayName} at ${timeStr}`, 'success');
        await fetchData(); // Refresh to update availability
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to book slot', 'error');
        await fetchData(); // Refresh anyway to show updated availability
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      showToast('Failed to book slot', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showToast('Session cancelled', 'info');
        fetchData();
      } else {
        showToast('Failed to cancel session', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('Failed to cancel session', 'error');
    }
  };

  const handleSwitchClient = () => {
    localStorage.removeItem('pt-client-id');
    router.push('/client');
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
        title="Couldn't load your sessions"
        message="We're having trouble getting your booking info. Try again in a moment."
        onRetry={fetchData}
        onGoHome={() => router.push('/')}
      />
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {ToastComponent}

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSwitchClient}
            className="text-gray-500 text-sm mb-2 hover:text-gray-400"
          >
            ← Switch client
          </button>
          <h1 className="text-2xl font-bold text-white">
            Hi {client.name}
          </h1>
          <p className={`text-lg mt-1 ${client.sessionsRemaining <= 3 ? 'text-accent-hover font-medium' : 'text-gray-500'}`}>
            <span className="text-accent font-bold">{client.sessionsRemaining}</span> session{client.sessionsRemaining !== 1 ? 's' : ''} remaining
            {client.sessionsRemaining <= 3 && client.sessionsRemaining > 0 && ' ⚠️'}
            {client.sessionsRemaining === 0 && ' - Contact your trainer!'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 mt-6">
        {/* Book a Slot Section */}
        {client.sessionsRemaining > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Book a Slot
            </h2>
            <SlotPicker
              availability={availability}
              onSelectSlot={handleBookSlot}
              isLoading={isBooking}
            />
          </section>
        )}

        {/* Upcoming Sessions Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Your Upcoming Sessions
          </h2>
          <SessionList
            sessions={bookings}
            onCancel={handleCancelBooking}
          />
        </section>
      </div>
    </div>
  );
}
