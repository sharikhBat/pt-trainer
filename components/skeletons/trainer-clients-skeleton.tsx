'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TrainerClientsSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-3">
        {/* Client cards with +/- controls */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-[#141414] border border-[#262626] rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#262626] px-6 py-4">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
