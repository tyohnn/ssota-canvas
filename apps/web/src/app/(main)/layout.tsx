import LayoutTemplate from '../template';
import { MainHeader } from './_components/MainHeader';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutTemplate>
      <MainHeader />
      {children}
    </LayoutTemplate>
  );
}
