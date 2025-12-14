'use client';

import { Card } from './ui/card';

interface ClientCardProps {
  name: string;
  sessionsRemaining: number;
  onClick?: () => void;
  showSessions?: boolean;
  onAdjustSessions?: (delta: number) => void;
}

export function ClientCard({ name, sessionsRemaining, onClick, showSessions = false, onAdjustSessions }: ClientCardProps) {
  const isLowSessions = sessionsRemaining <= 3;

  if (onAdjustSessions) {
    // Trainer view with +/- controls
    return (
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-white text-lg">{name}</span>
          {isLowSessions && sessionsRemaining > 0 && (
            <span className="text-accent-hover" title="Low sessions">⚠️</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjustSessions(-1)}
            disabled={sessionsRemaining <= 0}
            className="w-10 h-10 rounded-full bg-[#1c1c1c] text-gray-400 font-bold text-lg
              hover:bg-[#262626] active:bg-[#333] transition-colors border border-[#333]
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className={`w-12 text-center font-bold text-lg tabular-nums
            ${isLowSessions ? 'text-accent-hover' : 'text-gray-100'}`}>
            {sessionsRemaining}
          </span>
          <button
            onClick={() => onAdjustSessions(1)}
            className="w-10 h-10 rounded-full bg-accent/20 text-accent-hover font-bold text-lg
              hover:bg-accent/30 active:bg-accent/40 transition-colors border border-accent/30"
          >
            +
          </button>
        </div>
      </Card>
    );
  }

  // Client selection view
  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className="flex items-center justify-between min-h-[64px]"
    >
      <span className="font-medium text-white text-lg">{name}</span>
      {showSessions && (
        <span className={`text-sm ${isLowSessions ? 'text-accent-hover' : 'text-gray-400'}`}>
          {sessionsRemaining} sessions
        </span>
      )}
    </Card>
  );
}
