import type { Metadata } from 'next';
import Landing from './_components/Landing';

export const metadata: Metadata = {
  title: 'SSOTA - Where Humans and AI Agents Collaborate on One Canvas',
  description:
    'Break down tool silos and workflow handoffs. SSOTA unifies planning, design, development, and deployment on a single AI-native canvas. Work with AI agents that understand your entire project context.',
  openGraph: {
    title: 'SSOTA - Where Humans and AI Agents Collaborate on One Canvas',
    description:
      'Break down tool silos and workflow handoffs. SSOTA unifies planning, design, development, and deployment on a single AI-native canvas.',
  },
};

export default function Page() {
  return <Landing />;
}
