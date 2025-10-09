import { Skeleton } from '@workspace/ui/components/ui/skeleton';
/**
 * Renders five horizontally arranged skeleton placeholders for organization workspaces.
 *
 * Each placeholder row contains a small square skeleton and a flexible rectangular skeleton,
 * providing a compact loading state for a list of workspaces.
 *
 * @returns A React fragment containing five skeleton rows used as placeholders while workspace data loads.
 */
export function OrgWorkspacesSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex h-8 items-center gap-2 rounded-md px-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 flex-1 rounded" />
        </div>
      ))}
    </>
  );
}