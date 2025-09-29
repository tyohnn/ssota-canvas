import { Skeleton } from '@workspace/ui/components/ui/skeleton';
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
