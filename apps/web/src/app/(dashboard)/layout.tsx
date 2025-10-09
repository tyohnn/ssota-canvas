import LayoutTemplate from '../template';

/**
 * Wraps provided children with the application's dashboard layout template.
 *
 * @param children - Content to render inside the dashboard layout
 * @returns The dashboard layout element containing `children`
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutTemplate>{children}</LayoutTemplate>;
}