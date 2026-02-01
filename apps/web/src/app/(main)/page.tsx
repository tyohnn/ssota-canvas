import type { Metadata } from 'next';
import Landing from './_components/Landing';

export const metadata: Metadata = {
  title: 'SSOTA - Structure research. Build the next big thing.',
  description:
    'Not another summarizer. A partner for structure. Drop your sources—links, videos, PDFs, audio—on one canvas. SSOTA\'s AI agent turns them into a structured board, so you can reach a plan, make a decision, and make your next big move.',
  openGraph: {
    title: 'SSOTA - Structure research. Build the next big thing.',
    description:
      "Not another summarizer. A partner for structure. Drop your sources on one canvas. SSOTA's AI agent turns them into a structured board—so you can reach a plan, make a decision, and make your next big move.",
  },
};

export default function Page() {
  return <Landing />;
}
