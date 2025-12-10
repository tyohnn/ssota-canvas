/**
 * Landing Showcase Page (Server Component)
 *
 * 스크롤 기반 인터랙티브 마케팅 랜딩페이지
 */

import { ShowcasePage as ShowcasePageContent } from '@/domains/landing/frontend/components/showcase-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SSOTA - ONE CANVAS WHERE YOUR WORK LIVES',
  description:
    'From Plan, Research, Design to Make, Create, Develop on limitless canvas with collaborating AI. Transform your software development workflow with SSOTA.',
  keywords: [
    'SSOTA',
    'canvas',
    'collaboration',
    'AI',
    'software development',
    'planning',
    'design',
    'development',
    'workflow',
  ],
  openGraph: {
    title: 'SSOTA - ONE CANVAS WHERE YOUR WORK LIVES',
    description:
      'From Plan, Research, Design to Make, Create, Develop on limitless canvas with collaborating AI.',
    type: 'website',
    siteName: 'SSOTA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSOTA - ONE CANVAS WHERE YOUR WORK LIVES',
    description:
      'From Plan, Research, Design to Make, Create, Develop on limitless canvas with collaborating AI.',
  },
};

export default function ShowcasePage() {
  return <ShowcasePageContent />;
}
