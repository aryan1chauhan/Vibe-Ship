'use client';

interface SkeletonProps {
  className?: string;
  lines?: number;
  circle?: boolean;
}

export function Skeleton({ className = '', lines, circle }: SkeletonProps) {
  if (circle) {
    return <div className={`shimmer rounded-full ${className}`} />;
  }

  if (lines) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-4 rounded"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    );
  }

  return <div className={`shimmer rounded ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10" circle />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function BriefSkeleton() {
  return (
    <div className="glass p-6 space-y-3 animate-border-glow">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" circle />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

export function SessionSkeleton() {
  return (
    <div className="session-card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-2 h-2" circle />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    </div>
  );
}
