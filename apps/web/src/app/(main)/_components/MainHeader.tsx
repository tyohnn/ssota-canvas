import { Button } from '@workspace/ui/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export async function MainHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            ssota
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="#get-started"
              className="text-gray-600 hover:text-gray-900"
            >
              Get Started
            </Link>
            <Link href="#demo" className="text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
          </nav>

          {/* Auth Button */}
          <div>
            {user ? (
              <Button asChild className="cursor-pointer">
                <Link href="/r/">Dashboard</Link>
              </Button>
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
