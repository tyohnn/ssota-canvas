import LayoutTemplate from '../template';

/**
 * Wraps page content with the application's layout template.
 *
 * Renders the shared LayoutTemplate component with the provided children as its content.
 *
 * @param children - Content to be rendered inside the layout template
 * @returns A React element that renders LayoutTemplate containing `children`
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutTemplate>{children}</LayoutTemplate>;
}