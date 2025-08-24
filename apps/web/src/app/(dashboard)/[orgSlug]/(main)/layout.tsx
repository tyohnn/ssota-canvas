import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/ui/sidebar";
import { DashboardSidebar } from "@/domains/dashboard/components/layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="overflow-hidden overscroll-none h-svh">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
