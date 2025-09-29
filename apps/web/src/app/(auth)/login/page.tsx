// next
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
// utils
import { createClient } from '@/utils/supabase/server';
// components
import { GalleryVerticalEnd } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OAuthButtons } from '@/components/auth/oauth-signin';
// constants
import { appDefaultUrl, loginErrorMessage } from '../constant';

export default async function login(props: {
  searchParams: Promise<{ message: string }>;
}) {
  // const searchParams = await props.searchParams;
  const cookieJar = await cookies();
  const lastSignedInMethod = cookieJar.get('lastSignedInMethod')?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect(appDefaultUrl);
  }

  return (
    <section className="h-[calc(100vh-57px)] flex flex-1 flex-col justify-center items-center">
      <Card className="mx-auto min-w-96">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* {searchParams?.message && (
            <div className="text-destructive text-center text-sm mb-2">
              {searchParams.message || loginErrorMessage}
            </div>
          )} */}
          <OAuthButtons lastSignedInMethod={lastSignedInMethod} />
          {/* <Separator className="my-2" />
          <form id="login-form" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
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
                <Label htmlFor="password">비밀번호</Label>
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
              로그인
              {lastSignedInMethod === "email" && (
                <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                  <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                  최근 로그인
                </div>
              )}
            </Button>
          </form>
          <Separator className="my-2" />
          <div className="text-center text-sm">
            처음이신가요?{" "}
            <Link href="/register" passHref>
              <Button variant="link">회원가입</Button>
            </Link>
          </div> */}
        </CardContent>
      </Card>
    </section>
  );
}
