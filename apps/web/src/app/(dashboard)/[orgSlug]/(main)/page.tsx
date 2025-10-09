import { Suspense } from 'react';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { WorkspaceList } from '@/domains/dashboard/components/workspace-list';
import { DashboardHeader } from '@/domains/dashboard/components/layout/dashboard-sidebar/dashboard-header';

/**
 * Render the dashboard page layout with a centered content container and a Suspense-wrapped area that shows skeleton placeholders while content is loading.
 *
 * @returns The dashboard page JSX element containing the layout and a Suspense fallback of Skeleton placeholders.
 */
export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* <DashboardHeader /> */}
      <div className="flex flex-1 flex-col gap-4 container mx-auto px-4 pt-4">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          }
        >
          {/* <WorkspaceList /> */}
        </Suspense>
      </div>
    </div>
  );
}