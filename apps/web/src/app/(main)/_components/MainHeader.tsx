import Link from 'next/link';

import { Button } from '@workspace/ui/components/ui/button';

import { ThemeToggle } from '@/app/(dashboard)/components/theme-toggle';
import { getCurrentUser } from '@/domains/common/auth/server-auth.helpers';

// import { checkBetaApprovalAction } from '@/domains/user-management/actions/beta.actions';

export async function MainHeader() {
  const user = await getCurrentUser();

  // Beta check removed - all logged-in users can access dashboard
  // const isBetaApproved = user ? await checkBetaApprovalAction() : false;

  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            ssota
          </Link>

          {/* Theme Toggle & Auth Button */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Button asChild className="cursor-pointer">
                  <Link href="/r">Dashboard</Link>
                </Button>
                {/* Original implementation (commented out):
                {isBetaApproved ? (
                  <Button asChild className="cursor-pointer">
                    <Link href="/r">Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="cursor-pointer">
                    <Link href="/beta/application">Beta Access</Link>
                  </Button>
                )}
                */}
              </>
            ) : (
              <Button asChild className="cursor-pointer">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
