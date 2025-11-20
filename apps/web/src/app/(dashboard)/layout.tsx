import { DashboardProviders } from './providers';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardProviders>{children}</DashboardProviders>;
}
