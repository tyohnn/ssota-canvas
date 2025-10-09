import LayoutTemplate from '../template';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutTemplate>{children}</LayoutTemplate>;
}
