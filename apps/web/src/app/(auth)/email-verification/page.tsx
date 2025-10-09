// route : /auth/email-verification
// This page appears when a user sign up with email and password then needs to verify their email address.

// next
import Image from 'next/image';
import { redirect } from 'next/navigation';
// utils
import { createClient } from '@/utils/supabase/server';
// constants
import { appDefaultUrl } from '../constant';

/**
 * Render the email verification page or redirect authenticated users to the app default URL.
 *
 * Shows a centered logo and a heading prompting the user to check their email to complete signup.
 *
 * @returns A React element for the email verification UI; redirects to `appDefaultUrl` when a user is authenticated.
 */
export default async function EmailVerification() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If the user is already logged in, redirect to the home page
    return redirect(appDefaultUrl);
  }

  return (
    <section className="flex flex-1 flex-col justify-center items-center relative">
      <Image src="/images/logo.png" alt="Logo" width={200} height={100} />
      <h3 className="text-3xl font-bold mt-4">
        이메일을 확인하여 회원가입을 마무리하세요.
      </h3>
    </section>
  );
}