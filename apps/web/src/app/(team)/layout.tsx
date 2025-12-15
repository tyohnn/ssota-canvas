import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Team Blog | SSOTA',
  description:
    'SSOTA Team Blog - Stay updated with the latest news and updates.',
  openGraph: {
    title: 'Team Blog | SSOTA',
    description:
      'SSOTA Team Blog - Stay updated with the latest news and updates.',
  },
};

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold hover:underline">
              SSOTA
            </Link>
            <Link
              href="/team/blog"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Blog
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t mt-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} SSOTA Labs, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
