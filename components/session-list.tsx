'use client';

import { Button } from './ui/button';

interface Session {
  id: number;
  datetime: Date | string;
}

interface SessionListProps {
  sessions: Session[];
  onCancel: (id: number) => void;
  isLoading?: boolean;
}

export function SessionList({ sessions, onCancel, isLoading }: SessionListProps) {
  const formatSession = (datetime: Date | string) => {
    const date = new Date(datetime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    let dayStr: string;
    if (sessionDate.getTime() === today.getTime()) {
      dayStr = 'Today';
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      dayStr = 'Tomorrow';
    } else {
      dayStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

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
        const { dayStr, timeStr } = formatSession(session.datetime);
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
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        );
      })}
    </div>
  );
}
