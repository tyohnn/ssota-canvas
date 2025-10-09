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
 * Root HTML layout for the application that applies global fonts, mounts analytics and speed-insights, and wraps page content with app providers.
 *
 * @param children - Page content to render inside the Providers wrapper.
 * @returns The complete HTML structure used as the application's root layout.
 */
export default function LayoutTemplate({
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