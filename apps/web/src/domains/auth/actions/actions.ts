'use server';
// auth error code: https://supabase.com/docs/reference/javascript/auth-error-codes

// next
import { redirect, RedirectType } from 'next/navigation';
import { cookies } from 'next/headers';
// utils
import { createClient } from '@/utils/supabase/server';
import { Provider } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
// constants
import {
  appDefaultUrl,
  authenticationCallbackUrl,
  authenticationConfirmUrl,
  emailVerificationUrl,
  loginErrorMessage,
  loginUrl,
  signUpErrorMessage,
  serverErrorMessage,
  userNotFoundErrorMessage,
} from '../constant';
// import { signInSchema, signUpSchema } from '@/domains/auth/schemas';

// export async function signInWithEmailPassword(formData: FormData) {
//   const supabase = await createClient();

//   const rawData = {
//     email: formData.get('email'),
//     password: formData.get('password'),
//   };
//   const parseResult = signInSchema.safeParse(rawData);
//   if (!parseResult.success) {
//     redirect(
//       `${loginUrl}?message=${encodeURIComponent('입력값이 올바르지 않습니다.')}`
//     );
//   }
//   const data = parseResult.data;

//   const { error } = await supabase.auth.signInWithPassword(data);

//   if (error) {
//     redirect(`${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`);
//   }

//   const cookieJar = await cookies();
//   cookieJar.set('lastSignedInMethod', 'email');

//   redirect(appDefaultUrl);
// }

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
      emailRedirectTo: getURL('/auth/confirm'),
    },
  };

  const { error } = await supabase.auth.signInWithOtp(data);
  if (error) {
    if (error?.code === 'user_not_found') {
      redirect(
        `${loginUrl}?message=${encodeURIComponent(userNotFoundErrorMessage)}`
      );
    }
    redirect(`${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`);
  }

  const cookieJar = await cookies();
  cookieJar.set('lastSignedInMethod', 'magicLink');

  redirect(appDefaultUrl);
}

// export async function signUp(formData: FormData) {
//   const supabase = await createClient();

//   const rawData = {
//     email: formData.get('email'),
//     password: formData.get('password'),
//   };
//   const parseResult = signUpSchema.safeParse(rawData);
//   if (!parseResult.success) {
//     redirect(
//       `${loginUrl}?message=${encodeURIComponent('입력값이 올바르지 않습니다.')}`
//     );
//   }
//   const data = parseResult.data;

//   const { error } = await supabase.auth.signUp({
//     ...data,
//     options: {
//       emailRedirectTo: getURL(authenticationConfirmUrl),
//     },
//   });

//   if (error) {
//     redirect(`${loginUrl}?message=${encodeURIComponent(registerErrorMessage)}`);
//   }

//   const cookieJar = await cookies();
//   cookieJar.set('lastSignedInMethod', 'email');

//   redirect(emailVerificationUrl); // email-verification 으로 이동
// }

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function oAuthSignIn(
  provider: Provider,
  enrollmentCode?: string | null
) {
  if (!provider) {
    return redirect(
      `${loginUrl}?message=${encodeURIComponent(serverErrorMessage)}`
    );
  }

  const supabase = await createClient();
  let redirectUrl = getURL(authenticationCallbackUrl);
  if (enrollmentCode) {
    redirectUrl = `${redirectUrl}?enrollment_code=${enrollmentCode}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        // we need this to be able to select an account from google consent page when logging in after logging out
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    redirect(`${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`);
  }

  const cookieJar = await cookies();
  cookieJar.set('lastSignedInMethod', provider);

  return redirect(data.url);
}
