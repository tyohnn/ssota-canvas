import { Button } from '@workspace/ui/components/ui/button';
import Link from 'next/link';
import RotatingBracket from './landing/RotatingBracket';

function PlaceholderBox({ className }: { className?: string }) {
  return (
    <div
      className={`w-full h-full border-2 border-dashed border-gray-300 rounded-md bg-gray-50 ${className ?? ''}`}
    />
  );
}

function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 md:py-32 ${className ?? ''}`}>
      {children}
    </section>
  );
}

export default function Landing() {
  const rotating = [
    'vibe coder',
    'Cursor',
    'Claude Code',
    'Content Creator',
    'Founder',
    'Indie Hacker',
    'Student',
    'Agency',
  ];

  const heroTabs = ['Vibe Coder', 'Content', 'Learning'];

  return (
    <div className="min-h-svh w-full">
      {/* Hero */}
      <Section className="pt-24 md:pt-32">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              AI canvas for [
              <RotatingBracket items={rotating} />]
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your workspace, understood. 2D docs in, 2D docs out.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="#get-started">
                <Button size="lg">Start free</Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  Watch demo
                </Button>
              </Link>
              <Link href="#templates">
                <Button size="lg" variant="ghost">
                  Browse templates
                </Button>
              </Link>
            </div>
            <div className="flex gap-2 justify-center text-sm text-gray-500">
              <span className="px-2 py-1 rounded border">Visual canvas</span>
              <span className="px-2 py-1 rounded border">
                Universal node system
              </span>
              <span className="px-2 py-1 rounded border">
                Real-time previews
              </span>
            </div>
          </div>

          {/* Preview below copy with static tabs and time indicator placeholder */}
          <div className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {heroTabs.map(t => (
                  <button
                    key={t}
                    className={`text-sm px-3 py-1.5 rounded-md border transition-colors bg-white text-gray-700 border-gray-300`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="w-40 md:w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900"
                  style={{ width: `0%` }}
                  aria-label="time indicator"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="aspect-video">
                <PlaceholderBox className="w-full h-full" />
              </div>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Preview placeholder — tabs will auto-advance in interactive
                build. Video next; interactive component final.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Core Value Proposition */}
      <Section>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Workspace-native 2D intelligence
            </h2>
            <p className="text-gray-600">
              Bring your 2D work artifacts into a visual canvas. ssota
              understands structures and relationships across documents, and
              generates new canvases, tables, kanbans, or markdown views on
              demand—grounded in your workspace.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              'Ingest any 2D artifact',
              'Understand relationships',
              'Generate to spec',
            ].map(title => (
              <div key={title} className="p-6 border rounded-lg bg-white/50">
                <div className="w-10 h-10 mb-4">
                  <PlaceholderBox />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-600">
                  Placeholder description for {title.toLowerCase()}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Pillars */}
      <Section className="bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Ingest · Understand · Generate · Organize · Evolve
          </h2>
          <div className="grid md:grid-cols-5 gap-6">
            {['Ingest', 'Understand', 'Generate', 'Organize', 'Evolve'].map(
              p => (
                <div key={p} className="p-6 border rounded-lg bg-white">
                  <div className="w-8 h-8 mb-3">
                    <PlaceholderBox />
                  </div>
                  <h4 className="font-semibold mb-1">{p}</h4>
                  <p className="text-xs text-gray-600">
                    Short description placeholder.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </Section>

      {/* Quickstart */}
      <Section id="get-started">
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              From zero to workspace-aware in 5 minutes
            </h2>
            <ol className="space-y-3 list-decimal list-inside text-gray-700">
              <li>
                Connect your workspace (import IA/stories/wireframes or start
                blank)
              </li>
              <li>
                Ask what you need (e.g., “Generate 10 user stories for the
                Dashboard IA”)
              </li>
              <li>Review on canvas, tweak, export</li>
            </ol>
            <div className="flex gap-3 pt-2">
              <Button>Start now</Button>
              <Button variant="outline">See templates</Button>
            </div>
          </div>
          <div className="w-full">
            <div className="aspect-video">
              <PlaceholderBox className="w-full h-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Quickstart walkthrough placeholder
            </p>
          </div>
        </div>
      </Section>

      {/* Build & Deploy Inspired */}
      <Section id="demo" className="bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="w-full order-2 md:order-1">
            <div className="aspect-video">
              <PlaceholderBox className="w-full h-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Understanding → Output flow placeholder
            </p>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h2 className="text-3xl font-bold">
              One canvas from understanding to output
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>Single source model for 2D documents</li>
              <li>Runtime generation of nodes/types driven by templates</li>
              <li>
                Artifact-first collaboration (documents, structured data, flows)
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Single Use Case, Persona Examples */}
      <Section>
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">
            One use case: AI that understands your workspace
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['Vibe Coder', 'Content Marketer', 'Learning'].map(persona => (
              <div key={persona} className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">{persona} workspace</h3>
                <p className="text-sm text-gray-600 mb-4">
                  IA → stories → maps → wireframes (example)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square">
                    <PlaceholderBox />
                  </div>
                  <div className="aspect-square">
                    <PlaceholderBox />
                  </div>
                  <div className="aspect-square">
                    <PlaceholderBox />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* For Developers */}
      <Section className="bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              Built for extensibility, grounded in consistency
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>
                Next.js 15, React 19, TypeScript 5, React Flow, Supabase +
                Drizzle, Clerk
              </li>
              <li>
                Unified data model: blocks, edges, block_positions with RLS
              </li>
              <li>
                Multiple views from the same source; policy-driven rendering
              </li>
              <li>CLI/SDK (ssota-cli) for sync and templating (rolling out)</li>
            </ul>
          </div>
          <div className="w-full">
            <div className="h-64">
              <PlaceholderBox className="w-full h-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Code snippet / SDK placeholder
            </p>
          </div>
        </div>
      </Section>

      {/* Observability */}
      <Section>
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="w-full">
            <div className="aspect-video">
              <PlaceholderBox className="w-full h-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Live visualization placeholder
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">See what the AI sees</h2>
            <p className="text-gray-700">
              Real-time visualization of parsed structures and generated
              outputs. Inspect relationships, preview artifacts, and iterate in
              place.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 rounded border">Live status</span>
              <span className="px-2 py-1 rounded border">Logs</span>
              <span className="px-2 py-1 rounded border">
                Artifact previews
              </span>
              <span className="px-2 py-1 rounded border">
                Versioning (planned)
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Social Proof */}
      <Section className="bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">
            Creators and teams are already mapping their work in 2D
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10">
                <PlaceholderBox />
              </div>
            ))}
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 border rounded-lg bg-white">
                <div className="h-12 mb-3">
                  <PlaceholderBox />
                </div>
                <p className="text-sm text-gray-700">
                  “Short testimonial placeholder text.”
                </p>
                <p className="text-xs text-gray-500 mt-2">— Role / Company</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">
            Start free. Scale by usage.
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {['Free', 'Pro', 'Business', 'Enterprise'].map(plan => (
              <div key={plan} className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{plan}</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Feature placeholder</li>
                  <li>Feature placeholder</li>
                  <li>Feature placeholder</li>
                </ul>
                <div className="mt-4">
                  <Button variant={plan === 'Free' ? 'default' : 'outline'}>
                    Choose
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">FAQs</h2>
          <div className="space-y-4">
            {[
              'Do I need to build agent workflows to use ssota?',
              'What types of documents can ssota understand?',
              'How does ssota represent my documents?',
              'How do I export results?',
            ].map(q => (
              <details key={q} className="border rounded-md p-4 bg-white/50">
                <summary className="font-medium cursor-pointer">{q}</summary>
                <p className="mt-2 text-sm text-gray-700">
                  Answer placeholder text.
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Give your workspace a visual brain.
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Ingest, understand, and generate 2D documents—on one canvas.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg">Start free</Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-gray-900"
            >
              Watch demo
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
