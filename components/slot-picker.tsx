'use client';

import { useState } from 'react';

interface SlotPickerProps {
  availability: { date: string; slots: string[] }[];
  onSelectSlot: (date: string, time: string) => void;
  isLoading?: boolean;
}

export function SlotPicker({ availability, onSelectSlot, isLoading }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    availability.length > 0 ? availability[0].date : null
  );

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

  const selectedDaySlots = availability.find(d => d.date === selectedDate)?.slots || [];

  if (availability.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No available slots in the next 7 days
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {availability.map(({ date }) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px]
              ${selectedDate === date
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-[#141414] text-gray-300 hover:bg-[#1c1c1c] border border-[#262626]'
              }`}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-3 gap-2">
        {selectedDaySlots.map((time) => (
          <button
            key={time}
            onClick={() => selectedDate && onSelectSlot(selectedDate, time)}
            disabled={isLoading}
            className="py-3 px-2 rounded-xl bg-[#141414] border border-[#262626] text-gray-200 font-medium
              hover:bg-accent/20 hover:text-accent-hover hover:border-accent/30 active:bg-accent/30
              transition-all duration-150 min-h-[48px] disabled:opacity-50"
          >
            {formatTime(time)}
          </button>
        ))}
      </div>

      {selectedDaySlots.length === 0 && selectedDate && (
        <div className="text-center py-6 text-gray-500">
          <p>No slots available</p>
          <p className="text-sm mt-1">Try another day</p>
        </div>
      )}
    </div>
  );
}
