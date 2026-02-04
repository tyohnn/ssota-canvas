import type { Metadata } from 'next';
import { CTASection } from './_components/landing-v2/CTASection';
import { FeatureSection } from './_components/landing-v2/FeatureSection';
import { HeroSection } from './_components/landing-v2/HeroSection';
import { PricingSection } from './_components/landing-v2/PricingSection';
// import { TestimonialSection } from './_components/landing-v2/TestimonialSection';
import { Footer } from './_components/landing-v2/Footer';
import { getCurrentUser } from '@/domains/common/auth/server-auth.helpers';

export const metadata: Metadata = {
  title: 'SSOTA | Structure research. Build the next big thing.',
  description:
    'Not another summarizer. A partner for structure. Drop your sources—links, videos, PDFs, audio—on one canvas. SSOTA\'s AI agent turns them into a structured canvas, so you can reach a plan, make a decision, and make your next big move.',
  openGraph: {
    title: 'SSOTA | Structure research. Build the next big thing.',
    description:
      "Not another summarizer. A partner for structure. Drop your sources on one canvas. SSOTA's AI agent turns them into a structured canvas—so you can reach a plan, make a decision, and make your next big move.",
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'SSOTA | Structure research. Build the next big thing.' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og'],
  },
};

export default async function Page() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <HeroSection isLoggedIn={!!user} />
      <FeatureSection />
      <CTASection isLoggedIn={!!user} />
      {/* <TestimonialSection /> */}
      {/* <PricingSection /> */}
      <Footer />
    </main>
  );
}
