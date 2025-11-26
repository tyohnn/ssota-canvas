/**
 * Beta Layout
 *
 * Layout for beta-related pages
 * Includes MainHeader for navigation
 */

import { MainHeader } from '../../(main)/_components/MainHeader';

export default function BetaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <MainHeader />
      <main>{children}</main>
    </div>
  );
}
