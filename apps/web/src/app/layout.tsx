import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'SSOTA - Where Humans and AI Agents Collaborate on One Canvas',
    template: '%s | SSOTA',
  },
  description:
    'Break down tool silos and workflow handoffs. SSOTA unifies planning, design, development, and deployment on a single AI-native canvas. Work with AI agents that understand your entire project context.',
  keywords: [
    'AI workspace',
    'canvas collaboration',
    'workflow automation',
    'AI agents',
    'design to code',
    'handoff elimination',
    'unified workspace',
    'blocks',
    'visual workflow',
    'context engineering',
  ],
  authors: [{ name: 'SSOTA Labs, Inc' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ssota.io',
    siteName: 'SSOTA',
    title: 'SSOTA - Where Humans and AI Agents Collaborate on One Canvas',
    description:
      'Break down tool silos and workflow handoffs. SSOTA unifies planning, design, development, and deployment on a single AI-native canvas.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSOTA - Where Humans and AI Agents Collaborate on One Canvas',
    description:
      'Break down tool silos and workflow handoffs. SSOTA unifies planning, design, development, and deployment on a single AI-native canvas.',
  },
};

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
