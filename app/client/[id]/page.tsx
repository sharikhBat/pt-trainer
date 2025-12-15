'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SlotPicker } from '@/components/slot-picker';
import { SessionList } from '@/components/session-list';
import { useToast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ClientBookingSkeleton } from '@/components/skeletons/client-booking-skeleton';

interface Client {
  id: number;
  name: string;
  sessionsRemaining: number;
}

interface Booking {
  id: number;
  date: string;
  hour: number;
}

type SlotStatus = 'available' | 'booked' | 'blocked' | 'past';

interface SlotWithStatus {
  time: string;
  status: SlotStatus;
}

interface Availability {
  date: string;
  slots: SlotWithStatus[];
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
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<Booking | null>(null);

  const clientId = params.id as string;

  // Verify session on mount
  useEffect(() => {
    const sessionData = localStorage.getItem('pt-client-session');
    if (!sessionData) {
      router.replace('/client');
      return;
    }
    try {
      const session = JSON.parse(sessionData);
      // Check if session is for this client
      if (session.clientId !== parseInt(clientId)) {
        router.replace('/client');
        return;
      }
      // Check if session is still valid (30 days)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (!session.verified || session.timestamp < Date.now() - thirtyDays) {
        localStorage.removeItem('pt-client-session');
        router.replace('/client');
        return;
      }
    } catch {
      localStorage.removeItem('pt-client-session');
      router.replace('/client');
    }
  }, [clientId, router]);

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

    // Optimistically mark the slot as booked
    const previousAvailability = availability;
    setAvailability(prev => prev.map(day =>
      day.date === date
        ? {
            ...day,
            slots: day.slots.map(slot =>
              slot.time === time ? { ...slot, status: 'booked' as SlotStatus } : slot
            )
          }
        : day
    ));

    try {
      // Extract hour from time string (e.g., "21:00" -> 21)
      const hour = parseInt(time.split(':')[0]);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, date, hour }),
      });

      if (response.ok) {
        // Format for toast message
        const displayDate = new Date(date + 'T00:00:00');
        const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' });
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        showToast(`Booked for ${dayName} at ${displayHour}:00 ${ampm}`, 'success');
        await fetchData(); // Refresh to update availability
      } else {
        const data = await response.json();
        // Rollback: restore the slot to availability
        setAvailability(previousAvailability);
        // Show specific error or fallback message
        const errorMessage = data.error || 'Booking failed - slot may no longer be available';
        showToast(errorMessage, 'error');
        // Refresh to ensure UI matches actual availability
        await fetchData();
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      // Rollback: restore the slot to availability
      setAvailability(previousAvailability);
      showToast('Something went wrong. Please check your connection and try again.', 'error');
      // Refresh to ensure UI is in sync with server
      await fetchData();
    } finally {
      setIsBooking(false);
    }
  };

  // Show confirmation dialog before cancelling
  const handleCancelBooking = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setConfirmCancelBooking(booking);
    }
  };

  // Actually cancel the booking after confirmation
  const handleConfirmCancel = async () => {
    if (!confirmCancelBooking || cancellingId !== null) return;

    const bookingId = confirmCancelBooking.id;
    const bookingToCancel = confirmCancelBooking;

    setConfirmCancelBooking(null);
    setCancellingId(bookingId);

    // Optimistically remove from UI
    setBookings(prev => prev.filter(b => b.id !== bookingId));

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showToast('Session cancelled', 'info');
        // Refresh to get updated availability (slot is now free)
        await fetchData();
      } else {
        const data = await response.json();
        // Rollback: restore the booking to UI
        setBookings(prev => [...prev, bookingToCancel].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.hour - b.hour;
        }));
        showToast(data.error || 'Couldn\'t cancel session. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Rollback: restore the booking to UI
      setBookings(prev => [...prev, bookingToCancel].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.hour - b.hour;
      }));
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatBookingForConfirm = (booking: Booking) => {
    const displayDate = new Date(booking.date + 'T00:00:00');
    const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const displayHour = booking.hour > 12 ? booking.hour - 12 : booking.hour === 0 ? 12 : booking.hour;
    const ampm = booking.hour >= 12 ? 'PM' : 'AM';
    return `${dayName} at ${displayHour}:00 ${ampm}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('pt-client-id');
    localStorage.removeItem('pt-client-session');
    router.push('/client');
  };

  if (isLoading) {
    return <ClientBookingSkeleton />;
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

      {/* Cancel Confirmation */}
      <BottomSheet
        isOpen={!!confirmCancelBooking}
        onClose={() => setConfirmCancelBooking(null)}
        title="Cancel this session?"
        subtitle={confirmCancelBooking ? formatBookingForConfirm(confirmCancelBooking) : undefined}
        confirmLabel="Yes, Cancel"
        onConfirm={handleConfirmCancel}
        variant="danger"
      />

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-white">
              Hi {client.name}
            </h1>
            <button
              onClick={handleLogout}
              className="text-gray-500 text-sm hover:text-gray-400 px-3 py-1 rounded-lg border border-[#333] hover:border-[#444]"
            >
              Logout
            </button>
          </div>
          <p className={`text-lg ${client.sessionsRemaining <= 3 ? 'text-accent-hover font-medium' : 'text-gray-500'}`}>
            <span className="text-accent font-bold">{client.sessionsRemaining}</span> session{client.sessionsRemaining !== 1 ? 's' : ''} remaining
            {client.sessionsRemaining <= 3 && client.sessionsRemaining > 0 && ' '}
            {client.sessionsRemaining === 0 && ' - Contact your trainer!'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 mt-6">
        {/* Book a Slot Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Book a Slot
          </h2>
          {client.sessionsRemaining > 0 ? (
            <SlotPicker
              availability={availability}
              onSelectSlot={handleBookSlot}
              isLoading={isBooking}
            />
          ) : (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 text-center">
              <p className="text-gray-400 font-medium">No sessions remaining</p>
              <p className="text-gray-500 text-sm mt-2">Contact your trainer to add more sessions</p>
            </div>
          )}
        </section>

        {/* Upcoming Sessions Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Your Upcoming Sessions
          </h2>
          <SessionList
            sessions={bookings}
            onCancel={handleCancelBooking}
            cancellingId={cancellingId}
          />
        </section>
      </div>
    </div>
  );
}
