'use client';

import { useState, useMemo, useEffect } from 'react';

type SlotStatus = 'available' | 'booked' | 'blocked' | 'past';

interface SlotWithStatus {
  time: string;
  status: SlotStatus;
}

interface SlotPickerProps {
  availability: { date: string; slots: SlotWithStatus[] }[];
  onSelectSlot: (date: string, time: string) => void;
  isLoading?: boolean;
}

export function SlotPicker({ availability, onSelectSlot, isLoading }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    availability.length > 0 ? availability[0].date : null
  );

  // Filter out past slots for today (client-side to handle stale data)
  const filteredAvailability = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHour = now.getHours();

    return availability.map(day => {
      if (day.date === todayStr) {
        // For today, mark slots that have passed as 'past'
        const updatedSlots = day.slots.map(slot => {
          const [hours] = slot.time.split(':').map(Number);
          if (hours <= currentHour) {
            return { ...slot, status: 'past' as SlotStatus };
          }
          return slot;
        });
        return { ...day, slots: updatedSlots };
      }
      return day;
    });
  }, [availability]);

  // Update selectedDate if it's no longer valid
  useEffect(() => {
    if (filteredAvailability.length > 0) {
      const dateExists = filteredAvailability.some(d => d.date === selectedDate);
      if (!dateExists) {
        setSelectedDate(filteredAvailability[0].date);
      }
    }
  }, [filteredAvailability, selectedDate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    const [hours] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:00 ${suffix}`;
  };

  const selectedDaySlots = filteredAvailability.find(d => d.date === selectedDate)?.slots || [];

  // Filter out past slots from display
  const visibleSlots = selectedDaySlots.filter(slot => slot.status !== 'past');

  // Check if selected day has any available slots
  const hasAvailableSlots = visibleSlots.some(slot => slot.status === 'available');

  if (filteredAvailability.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No slots to display
      </div>
    );
  }

  const getSlotStyles = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return 'bg-[#141414] border-[#262626] text-gray-200 hover:bg-accent/20 hover:text-accent-hover hover:border-accent/30 active:bg-accent/30 cursor-pointer';
      case 'booked':
        return 'bg-[#1a1a1a] border-[#1f1f1f] text-gray-600 cursor-not-allowed';
      case 'blocked':
        return 'bg-[#0f0f0f] border-[#1a1a1a] text-gray-700 cursor-not-allowed';
      default:
        return 'bg-[#0f0f0f] border-[#1a1a1a] text-gray-700 cursor-not-allowed';
    }
  };

  return (
    <div className="space-y-4">
      {/* Date tabs - horizontal scroll, show all dates */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {filteredAvailability.map(({ date, slots }) => {
          const dayHasAvailable = slots.some(s => s.status === 'available');
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px]
                ${selectedDate === date
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : dayHasAvailable
                    ? 'bg-[#141414] text-gray-300 hover:bg-[#1c1c1c] border border-[#262626]'
                    : 'bg-[#0f0f0f] text-gray-500 border border-[#1a1a1a]'
                }`}
            >
              {formatDate(date)}
            </button>
          );
        })}
      </div>

      {/* Time slots grid - show all slots with different states */}
      <div className="grid grid-cols-3 gap-2">
        {visibleSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => slot.status === 'available' && selectedDate && onSelectSlot(selectedDate, slot.time)}
            disabled={isLoading || slot.status !== 'available'}
            className={`relative py-3 px-2 rounded-xl border font-medium transition-all duration-150 min-h-[48px] ${getSlotStyles(slot.status)} ${isLoading ? 'opacity-50' : ''}`}
          >
            <span className={slot.status !== 'available' ? 'opacity-60' : ''}>
              {formatTime(slot.time)}
            </span>
            {slot.status === 'booked' && (
              <span className="block text-[10px] text-gray-500 mt-0.5">Booked</span>
            )}
            {slot.status === 'blocked' && (
              <span className="block text-[10px] text-gray-600 mt-0.5">Unavailable</span>
            )}
          </button>
        ))}
      </div>

      {visibleSlots.length === 0 && selectedDate && (
        <div className="text-center py-6 text-gray-500">
          <p>No slots for this day</p>
        </div>
      )}

      {visibleSlots.length > 0 && !hasAvailableSlots && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">All slots are taken or unavailable</p>
          <p className="text-xs mt-1">Try another day</p>
        </div>
      )}
    </div>
  );
}
