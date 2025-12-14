'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#262626] rounded-lg ${className}`}
    />
  );
}

// Common skeleton patterns
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#141414] border border-[#262626] rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export function SkeletonButton({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-10 rounded-xl ${className}`} />;
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonHeader({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-8 ${className}`} />;
}
