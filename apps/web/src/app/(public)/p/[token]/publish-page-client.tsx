'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Edge } from '@xyflow/react';
import { PublishedPageViewer } from '@/domains/share/frontend/components/published-page-viewer';
import { CopyFlowDialog } from '@/domains/share/frontend/components/copy-flow-dialog';
import { LoginPromptDialog } from '@/domains/share/frontend/components/login-prompt-dialog';
import { getUser } from '@/domains/auth/client/auth-helpers';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

interface PublishPageClientProps {
  token: string;
  title: string;
  icon?: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

export default function PublishPageClient({
  token,
  title,
  icon,
  initialNodes,
  initialEdges,
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
    const redirectTo = `/p/${token}?action=copy`;
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  };

  const handleCopyRequested = async () => {
    try {
      const user = await getUser();
      if (!user) {
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
        publishToken={token}
        title={title}
        icon={icon}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
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
    </>
  );
}
