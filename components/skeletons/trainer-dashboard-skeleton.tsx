'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TrainerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#262626] px-6 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-6">
        {/* Day sections */}
        {[1, 2, 3].map((day) => (
          <section key={day}>
            {/* Date header */}
            <Skeleton className="h-3 w-32 mb-3" />

            {/* Booking cards */}
            <div className="space-y-2">
              {[1, 2].map((booking) => (
                <div
                  key={booking}
                  className="bg-[#141414] border border-[#262626] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#262626] px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
