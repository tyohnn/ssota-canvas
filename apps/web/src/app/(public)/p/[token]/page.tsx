'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ShareProvider } from '@/domains/share/frontend/contexts/share-context';
import { PublishedPageViewer } from '@/domains/share/frontend/components/published-page-viewer';
import { CopyFlowDialog } from '@/domains/share/frontend/components/copy-flow-dialog';
import { LoginPromptDialog } from '@/domains/share/frontend/components/login-prompt-dialog';
import { createClient } from '@/utils/supabase/browser';

function PublishPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ token: string }>();
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const action = searchParams.get('action');

  React.useEffect(() => {
    if (action === 'copy') {
      handleCopyRequested();
    }
  }, [action]);

  const handleLogin = () => {
    const redirectTo = `/p/${params.token}?action=copy&token=${params.token}`;
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
    <>
      <PublishedPageViewer
        publishToken={params.token}
        onCopyRequested={handleCopyRequested}
      />

      <CopyFlowDialog
        publishToken={params.token}
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
    </>
  );
}

export default function PublishPage() {
  return (
    <ShareProvider>
      <PublishPageContent />
    </ShareProvider>
  );
}
