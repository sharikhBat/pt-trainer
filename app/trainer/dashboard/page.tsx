'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TrainerDashboardSkeleton } from '@/components/skeletons/trainer-dashboard-skeleton';

interface BookingWithClient {
  id: number;
  datetime: string;
  clientName: string;
  clientSessions: number;
  status?: string;
}

interface InProgressBooking {
  id: number;
  datetime: string;
  clientName: string;
}

interface GroupedBookings {
  [date: string]: BookingWithClient[];
}

export default function TrainerDashboard() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inProgressBooking, setInProgressBooking] = useState<InProgressBooking | null>(null);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

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

  const fetchBookings = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      setError(null);
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to load');
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Unable to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  const checkInProgressBookings = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      const response = await fetch('/api/bookings/in-progress');
      if (response.ok) {
        const data = await response.json();
        // Find a booking that hasn't been dismissed yet
        const pending = data.find((b: InProgressBooking) => !completedIds.has(b.id));
        if (pending && !showCompletionSheet) {
          setInProgressBooking(pending);
          setShowCompletionSheet(true);
        }
      }
    } catch (err) {
      console.error('Error checking in-progress bookings:', err);
    }
  }, [checkAuth, completedIds, showCompletionSheet]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Check for in-progress bookings periodically
  useEffect(() => {
    checkInProgressBookings();
    const interval = setInterval(checkInProgressBookings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkInProgressBookings]);

  const handleLogout = () => {
    localStorage.removeItem('pt-trainer-auth');
    localStorage.removeItem('pt-user-type');
    router.push('/');
  };

  const handleCompleteSession = async () => {
    if (!inProgressBooking) return;

    const bookingId = inProgressBooking.id;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Session completed', 'success');
        setCompletedIds(prev => new Set([...prev, bookingId]));
        setShowCompletionSheet(false);
        setInProgressBooking(null);
        await fetchBookings();
      } else {
        const data = await response.json();
        // Show specific error message
        showToast(data.error || 'Failed to complete session. Please try again.', 'error');
        // Refresh to ensure UI is in sync
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      showToast('Something went wrong. Session may not have been completed.', 'error');
      // Refresh to ensure UI shows actual state
      await fetchBookings();
    }
  };

  const handleDismissCompletion = () => {
    if (inProgressBooking) {
      // Add to dismissed set so we don't show again this session
      setCompletedIds(prev => new Set([...prev, inProgressBooking.id]));
    }
    setShowCompletionSheet(false);
    setInProgressBooking(null);
  };

  const handleCompleteBooking = async (bookingId: number) => {
    setLoadingIds(prev => new Set([...prev, bookingId]));
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Session completed', 'success');
        await fetchBookings();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to complete session. Please try again.', 'error');
        // Refresh to ensure UI matches server state
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      showToast('Something went wrong. Session may not have been completed.', 'error');
      await fetchBookings();
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setLoadingIds(prev => new Set([...prev, bookingId]));
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showToast('Session cancelled', 'success');
        await fetchBookings();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to cancel session. Please try again.', 'error');
        // Refresh to ensure UI matches server state
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('Something went wrong. Please try again.', 'error');
      await fetchBookings();
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  // Group bookings by date
  const groupedBookings: GroupedBookings = bookings.reduce((acc, booking) => {
    const date = new Date(booking.datetime).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {} as GroupedBookings);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel: string;
    if (date.getTime() === today.getTime()) {
      dayLabel = 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${dayLabel} - ${dateLabel}`;
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return <TrainerDashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your schedule"
        message="We're having trouble getting your bookings. Try again in a moment."
        onRetry={fetchBookings}
        onGoHome={() => router.push('/')}
      />
    );
  }

  const sortedDates = Object.keys(groupedBookings).sort();

  const formatTimeForModal = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {ToastComponent}

      {/* Session Completion Bottom Sheet */}
      <BottomSheet
        isOpen={showCompletionSheet}
        onClose={handleDismissCompletion}
        subtitle={inProgressBooking ? `${formatTimeForModal(inProgressBooking.datetime)} session` : undefined}
        title={`Mark ${inProgressBooking?.clientName} complete?`}
        confirmLabel="Complete Session"
        cancelLabel="Cancel Session"
        onConfirm={handleCompleteSession}
        onCancel={() => {
          if (inProgressBooking) {
            handleCancelBooking(inProgressBooking.id);
          }
          handleDismissCompletion();
        }}
        showCancelAction={true}
      />

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Upcoming</h1>
          <button
            onClick={handleLogout}
            className="text-red-400/80 text-sm font-medium hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-6">
        {sortedDates.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-400">No upcoming sessions</p>
            <p className="text-sm text-gray-500 mt-2">
              Sessions will appear here when clients book
            </p>
          </Card>
        ) : (
          sortedDates.map((date) => (
            <section key={date}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" suppressHydrationWarning>
                {formatDateHeader(date)}
              </h2>
              <div className="space-y-2">
                {groupedBookings[date].map((booking) => {
                  const isCompleted = booking.status === 'completed';
                  const isCancelled = booking.status === 'cancelled';
                  const isActionable = !isCompleted && !isCancelled;
                  const isLoadingThis = loadingIds.has(booking.id);

                  return (
                    <Card
                      key={booking.id}
                      padding="sm"
                      className={`flex items-center justify-between ${
                        isCompleted ? 'border-emerald-600/30 bg-emerald-950/20' :
                        isCancelled ? 'border-red-600/20 bg-red-950/10 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-medium w-16 tabular-nums text-sm ${
                          isCompleted ? 'text-emerald-500' :
                          isCancelled ? 'text-red-400/70 line-through' : 'text-gray-500'
                        }`} suppressHydrationWarning>
                          {formatTime(booking.datetime)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            isCompleted ? 'text-emerald-400' :
                            isCancelled ? 'text-gray-500 line-through' : 'text-white'
                          }`}>
                            {booking.clientName}
                          </span>
                          {isCompleted ? (
                            <span className="text-xs text-emerald-500 font-medium">
                              ✓ Done
                            </span>
                          ) : isCancelled ? (
                            <span className="text-xs text-red-400/70 font-medium">
                              Cancelled
                            </span>
                          ) : (
                            <span
                              className={`text-sm tabular-nums ${
                                booking.clientSessions <= 3
                                  ? 'text-accent-hover'
                                  : 'text-gray-500'
                              }`}
                            >
                              ({booking.clientSessions} left)
                            </span>
                          )}
                        </div>
                      </div>
                      {isActionable && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCompleteBooking(booking.id)}
                            disabled={isLoadingThis}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                            aria-label="Complete session"
                          >
                            {isLoadingThis ? (
                              <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            ) : '✓'}
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isLoadingThis}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                            aria-label="Cancel session"
                          >
                            {isLoadingThis ? (
                              <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : '✕'}
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#262626] px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Link href="/trainer/clients/add" className="flex-1">
            <Button fullWidth variant="primary">
              Add Client
            </Button>
          </Link>
          <Link href="/trainer/clients" className="flex-1">
            <Button fullWidth variant="secondary">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
