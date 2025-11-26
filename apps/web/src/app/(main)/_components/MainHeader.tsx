import { Button } from '@workspace/ui/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ThemeToggle } from '@/app/(dashboard)/components/theme-toggle';
import { checkBetaApprovalAction } from '@/domains/user-management/actions/beta.actions';

export async function MainHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check beta approval status for logged-in users
  const isBetaApproved = user ? await checkBetaApprovalAction() : false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            ssota
          </Link>

          {/* Theme Toggle & Auth Button */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              isBetaApproved ? (
                <Button asChild className="cursor-pointer">
                  <Link href="/r">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="cursor-pointer">
                  <Link href="/beta/application">Beta Access</Link>
                </Button>
              )
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
