'use client';

import { useCallback, useId, useMemo } from 'react';

import type { OpenGraphMetadata } from '@/domains/link-app-space/shared/types/open-graph-metadata';
import {
  LinkView,
  useLinkBlock,
  type LinkPropertiesLike,
} from '@workspace/ssota-blocks/link';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@/components/ui/box';

export interface LinkFormContentProps {
  urlForView: string;
  /** properties from metadata (LinkView preview) - empty when no metadata yet */
  properties: Record<string, unknown>;
  onUrlChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onUrlSubmit: (urlString: string) => Promise<OpenGraphMetadata | null>;
  onMetadataFetched: (metadata: OpenGraphMetadata) => void;
}

export function LinkFormContent({
  urlForView,
  properties,
  onUrlChange,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
  onUrlSubmit,
  onMetadataFetched,
}: LinkFormContentProps) {
  const instanceId = useId();

  const handleUrlSubmit = useCallback(
    async (urlString: string) => {
      if (!workspaceId) {
        throw new Error('Please select a workspace');
      }
      onUrlChange(urlString);
      const metadata = await onUrlSubmit(urlString);
      if (metadata) {
        onMetadataFetched(metadata);
      }
    },
    [workspaceId, onUrlChange, onUrlSubmit, onMetadataFetched]
  );

  const deps = useMemo(
    () => ({
      onUrlSubmit: handleUrlSubmit,
    }),
    [handleUrlSubmit]
  );

  const hookResult = useLinkBlock(
    {
      url: urlForView,
      properties: properties as LinkPropertiesLike,
      isActive: true,
      instanceId,
      canPersist: true,
    },
    deps
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      hookResult.handleUrlChange(e);
      onUrlChange(value);
    },
    [hookResult, onUrlChange]
  );

  return (
    <Box className="flex flex-col gap-4">
        <Box
          className={cn(
            'relative w-full md:w-4/5 aspect-310/280 min-h-0 rounded-lg border border-border overflow-hidden bg-background mx-auto',
          '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
        )}
      >
        <LinkView
          {...hookResult}
          isActive={true}
          handleUrlChange={handleUrlChange}
        />
      </Box>
    </Box>
  );
}
