'use client';

import { useCallback, useId, useMemo } from 'react';

import type { GetXMetadataDTO } from '@/domains/x-app-space/shared/dtos/responses/post.responses';
import {
  XView,
  useXBlock,
  type XPropertiesLike,
} from '@workspace/ssota-blocks/x';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@/components/ui/box';

export interface XFormContentProps {
  urlForView: string;
  /** properties from metadata (XView preview) - empty when no metadata yet */
  properties: Record<string, unknown>;
  onUrlChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onUrlSubmit: (urlString: string) => Promise<GetXMetadataDTO | null>;
  onMetadataFetched: (metadata: GetXMetadataDTO) => void;
}

export function XFormContent({
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
}: XFormContentProps) {
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

  const hookResult = useXBlock(
    {
      url: urlForView,
      properties: properties as XPropertiesLike,
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
        <XView
          url={hookResult.url}
          metadata={hookResult.metadata}
          isLoading={hookResult.isLoading}
          hasError={hookResult.hasError}
          draftUrl={hookResult.draftUrl}
          isActive={true}
          inputRef={hookResult.inputRef}
          handleUrlChange={handleUrlChange}
          handleUrlSubmit={hookResult.handleUrlSubmit}
          handleUrlKeyDown={hookResult.handleUrlKeyDown}
          handleDoubleClick={hookResult.handleDoubleClick}
        />
      </Box>
    </Box>
  );
}
