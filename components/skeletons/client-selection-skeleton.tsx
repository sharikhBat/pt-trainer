'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export function ClientSelectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <Skeleton className="h-4 w-12 mb-4" />

        {/* Title */}
        <Skeleton className="h-8 w-48 mb-6" />

        {/* Client cards */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
