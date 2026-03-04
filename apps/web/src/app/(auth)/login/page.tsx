// next
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
// utils
import { createClient } from '@/utils/supabase/server';
// components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OAuthButtons } from '@/components/auth/oauth-signin';
import { SummarizeTab } from '@/app/(main)/_components/landing-v2/sections/demo-sections/tabs/SummarizeTab';
// constants
import { appDefaultUrl } from '@/domains/auth/constant';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Sign in to your SSOTA account to access your workspaces and collaborate with your team.',
  openGraph: {
    title: 'Login | SSOTA',
    description:
      'Sign in to your SSOTA account to access your workspaces and collaborate with your team.',
  },
};

export default async function login(props: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectUrl = searchParams.redirect;
  const cookieJar = await cookies();
  const lastSignedInMethod = cookieJar.get('lastSignedInMethod')?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 이미 로그인된 사용자는 redirect URL로 리다이렉트
    return redirect(redirectUrl || appDefaultUrl);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_2fr]">
      <div className="flex flex-col gap-4 border-r border-border p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="font-medium">
            ssota
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* {searchParams?.message && (
                  <div className="text-destructive text-center text-sm mb-2">
                    {searchParams.message || loginErrorMessage}
                  </div>
                )} */}
                <OAuthButtons lastSignedInMethod={lastSignedInMethod} redirectUrl={redirectUrl} />
                <p className="text-center text-muted-foreground text-xs">
                  By continuing, you agree to our{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Terms of Use
                  </Link>
                  {' '}and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
                {/* <Separator className="my-2" />
                <form id="login-form" className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@knarccv.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      minLength={8}
                      name="password"
                      id="password"
                      type="password"
                      placeholder="********"
                      required
                    />
                  </div>
                  <Button
                    formAction={signInWithEmailPassword}
                    className="relative w-full"
                    variant="default"
                  >
                    Sign in
                    {lastSignedInMethod === "email" && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                        <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                        Recent sign-in
                      </div>
                    )}
                  </Button>
                </form>
                <Separator className="my-2" />
                <div className="text-center text-sm">
                  New here?{" "}
                  <Link href="/register" passHref>
                    <Button variant="link">Sign up</Button>
                  </Link>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block min-h-0">
        <div className="absolute inset-0">
          <SummarizeTab startAnimation={true} />
        </div>
      </div>
    </div>
  );
}
