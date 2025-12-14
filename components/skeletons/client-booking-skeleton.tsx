'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ClientBookingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 mt-6">
        {/* Book a Slot Section */}
        <section>
          <Skeleton className="h-4 w-24 mb-4" />

          {/* Date tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-16 w-14 flex-shrink-0 rounded-xl" />
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </section>

        {/* Upcoming Sessions Section */}
        <section>
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-4 bg-[#141414] border border-[#262626] rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
