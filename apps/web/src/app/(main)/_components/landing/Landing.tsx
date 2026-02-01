import Link from 'next/link';

import { Button } from '@workspace/ui/components/ui/button';

import { createClient } from '@/utils/supabase/server';

import RotatingBracket from './RotatingBracket';

// import { checkBetaApprovalAction } from '@/domains/user-management/actions/beta.actions';

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Beta check removed - all logged-in users can access dashboard
  // const isBetaApproved = user ? await checkBetaApprovalAction() : false;

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

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center">
      {/* Hero Section */}
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="space-y-8 text-center">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <div>AI canvas for</div>
            <div>
              <RotatingBracket items={rotating} />
            </div>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your workspace, understood. 2D docs in, 2D docs out.
          </p>

          {/* Feature Tags */}
          <div className="flex gap-2 justify-center text-sm text-muted-foreground flex-wrap">
            <span className="px-3 py-1.5 rounded-md border border-border bg-card">
              Visual canvas
            </span>
            <span className="px-3 py-1.5 rounded-md border border-border bg-card">
              Universal node system
            </span>
            <span className="px-3 py-1.5 rounded-md border border-border bg-card">
              Real-time previews
            </span>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            {user ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="text-base px-8 py-6 cursor-pointer"
                >
                  <Link href="/r">Go to Dashboard</Link>
                </Button>
                {/* Original implementation (commented out):
                {isBetaApproved ? (
                  <Button
                    asChild
                    size="lg"
                    className="text-base px-8 py-6 cursor-pointer"
                  >
                    <Link href="/r">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-6 cursor-pointer"
                  >
                    <Link href="/beta/application">Apply for Beta Access</Link>
                  </Button>
                )}
                */}
              </>
            ) : (
              <Button
                asChild
                size="lg"
                className="text-base px-8 py-6 cursor-pointer"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
