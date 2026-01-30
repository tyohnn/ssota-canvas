import { PublicProviders } from './providers';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicProviders>
      <div className="min-h-screen w-full bg-background">{children}</div>
    </PublicProviders>
  );
}
