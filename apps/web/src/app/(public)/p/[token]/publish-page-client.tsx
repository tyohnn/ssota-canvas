'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShareProvider } from '@/domains/share/frontend/contexts/share-context';
import { PublishedPageViewer } from '@/domains/share/frontend/components/published-page-viewer';
import { CopyFlowDialog } from '@/domains/share/frontend/components/copy-flow-dialog';
import { LoginPromptDialog } from '@/domains/share/frontend/components/login-prompt-dialog';
import { createClient } from '@/utils/supabase/browser';
import { PublishedPageView } from '@/domains/share/shared/dtos';

interface PublishPageClientProps {
  initialData: PublishedPageView;
  token: string;
}

export default function PublishPageClient({
  initialData,
  token,
}: PublishPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'copy') {
      handleCopyRequested();
    }
  }, [action]);

  const handleLogin = () => {
    const redirectTo = `/p/${token}?action=copy&token=${token}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  };

  const handleCopyRequested = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setIsLoginOpen(true);
        return;
      }
      setIsCopyOpen(true);
    } catch (err) {
      setIsLoginOpen(true);
    }
  };

  return (
    <ShareProvider initialPublishedPage={initialData}>
      <PublishedPageViewer
        publishToken={token}
        initialData={initialData}
        onCopyRequested={handleCopyRequested}
      />

      <CopyFlowDialog
        publishToken={token}
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        onLoginRequired={() => {
          setIsCopyOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <LoginPromptDialog
        isOpen={isLoginOpen}
        onLogin={handleLogin}
        onClose={() => setIsLoginOpen(false)}
      />
    </ShareProvider>
  );
}
