import { Suspense } from "react";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardHeaderSkeleton } from "./components/dashboard-header-skeleton";
import { MainContentSkeleton } from "./components/main-content-skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>
      <main className="flex-1 overflow-hidden flex flex-col">
        <Suspense fallback={<MainContentSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}
