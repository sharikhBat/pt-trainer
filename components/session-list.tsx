'use client';

import { Button } from './ui/button';

interface Session {
  id: number;
  date: string;
  hour: number;
}

interface SessionListProps {
  sessions: Session[];
  onCancel: (id: number) => void;
  isLoading?: boolean;
  cancellingId?: number | null;
}

export function SessionList({ sessions, onCancel, isLoading, cancellingId }: SessionListProps) {
  const formatSession = (date: string, hour: number) => {
    // Get today and tomorrow for comparison
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    let dayStr: string;
    if (date === todayStr) {
      dayStr = 'Today';
    } else if (date === tomorrowStr) {
      dayStr = 'Tomorrow';
    } else {
      // Format the date for display
      const displayDate = new Date(date + 'T00:00:00');
      dayStr = displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    // Format hour for display (e.g., 21 -> "9:00 PM")
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const timeStr = `${displayHour}:00 ${ampm}`;

    return { dayStr, timeStr };
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        No upcoming sessions
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const { dayStr, timeStr } = formatSession(session.date, session.hour);
        return (
          <div
            key={session.id}
            className="flex items-center justify-between py-3 px-4 bg-[#141414] border border-[#262626] rounded-xl"
          >
            <div>
              <span className="font-medium text-white">{dayStr}</span>
              <span className="text-gray-500 ml-2 tabular-nums">{timeStr}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(session.id)}
              disabled={isLoading || cancellingId !== null}
            >
              {cancellingId === session.id ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
