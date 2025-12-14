'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging (in production, send to error tracking service)
    console.error('Application error:', error);
  }, [error]);

  return (
    <ErrorState
      title="Oops! Something went wrong"
      message="Don't worry, it's not you. We're working on fixing this."
      onRetry={reset}
      onGoHome={() => window.location.href = '/'}
    />
  );
}
