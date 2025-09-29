import LayoutTemplate from '../template';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutTemplate>{children}</LayoutTemplate>;
}
