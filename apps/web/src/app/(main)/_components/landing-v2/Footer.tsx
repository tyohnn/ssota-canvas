import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xl font-bold tracking-tight">SSOTA</span>
          <p className="text-sm text-muted-foreground mt-2">
            Structure your research. Build the next big thing.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} SSOTA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
