'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

const CARD_COUNT = 12;

/**
 * Drive grid loading skeleton.
 * Matches the drive grid layout for consistent loading UX.
 */
export function DriveGridSkeleton({
  loadingMessage = 'Loading drive...',
}: {
  loadingMessage?: string;
} = {}) {
  return (
    <div className="relative flex flex-1 min-h-0 flex-col overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-md border border-border bg-card p-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="mt-2 h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg border border-border bg-background/80 px-6 py-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-foreground">{loadingMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
