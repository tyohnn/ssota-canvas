/**
 * Beta Redirect Client
 *
 * Client-side redirect component for beta access pages
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';

interface BetaRedirectClientProps {
  redirectUrl: string;
  message?: string;
}

/**
 * Beta Redirect Client
 *
 * Shows loading state and redirects to beta page
 */
export function BetaRedirectClient({
  redirectUrl,
  message = 'Redirecting to beta application...',
}: BetaRedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectUrl);
  }, [redirectUrl, router]);

  return (
    <Box className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <CardTitle className="text-xl">{message}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Please wait...
        </CardContent>
      </Card>
    </Box>
  );
}
