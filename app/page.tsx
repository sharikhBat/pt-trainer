'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check localStorage for previous selection
    const userType = localStorage.getItem('pt-user-type');
    if (userType === 'trainer') {
      const trainerAuth = localStorage.getItem('pt-trainer-auth');
      if (trainerAuth) {
        try {
          const auth = JSON.parse(trainerAuth);
          if (auth.authenticated && auth.expires > Date.now()) {
            router.replace('/trainer/dashboard');
            return;
          }
        } catch {
          // Invalid auth data, continue to show buttons
        }
      }
      router.replace('/trainer');
      return;
    } else if (userType === 'client') {
      const clientId = localStorage.getItem('pt-client-id');
      if (clientId) {
        router.replace(`/client/${clientId}`);
      } else {
        router.replace('/client');
      }
      return;
    }
    // No stored preference, show buttons
    setIsChecking(false);
  }, [router]);

  const handleSelection = (type: 'trainer' | 'client') => {
    localStorage.setItem('pt-user-type', type);
    if (type === 'trainer') {
      router.push('/trainer');
    } else {
      router.push('/client');
    }
  };

  // Show blank screen while checking localStorage (prevents button flash)
  if (isChecking) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <Button
          size="xl"
          fullWidth
          onClick={() => handleSelection('client')}
          className="h-24 text-xl uppercase tracking-widest font-semibold"
        >
          Client
        </Button>

        <Button
          size="xl"
          fullWidth
          variant="secondary"
          onClick={() => handleSelection('trainer')}
          className="h-24 text-xl uppercase tracking-widest font-semibold"
        >
          Trainer
        </Button>
      </div>
    </div>
  );
}
