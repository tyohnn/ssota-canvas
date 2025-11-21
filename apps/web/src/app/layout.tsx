import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/styles/globals.css';
import { Providers } from './provider';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

/**
 * Root Layout
 *
 * Next.js에서 <html>과 <body> 태그는 오직 Root Layout에만 있어야 합니다.
 * 모든 nested layout은 <html>과 <body> 없이 children만 렌더링해야 합니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans`}
        suppressHydrationWarning
      >
        <SpeedInsights />
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
