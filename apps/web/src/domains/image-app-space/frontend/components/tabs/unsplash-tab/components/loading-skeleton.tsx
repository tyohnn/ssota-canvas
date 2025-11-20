'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

/**
 * Loading Skeleton Component
 */
export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className="aspect-video rounded-lg" />
      ))}
    </div>
  );
}

