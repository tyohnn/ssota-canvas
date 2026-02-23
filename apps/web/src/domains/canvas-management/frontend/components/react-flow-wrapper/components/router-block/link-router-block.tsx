'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Link as LinkIcon } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';

import { LinkLoadingState } from '@/domains/block-management/frontend/components/block/block-type/link/components/block-ui/link-loading-state';

import { resolveUrlToBlockConfig } from './utils/url-block-resolver';
import type { RouterNodeData } from './core/use-router-block';
import { useRouterBlock } from './core/use-router-block';

const LINK_ROUTER_SIZE = { width: 310, height: 280 };

/**
 * Link Router Block
 *
 * Phantom node that accepts a URL, resolves the block type (YouTube, Link, PDF, Audio, Image),
 * then replaces itself with the real block.
 */
export const LinkRouterBlock = memo(function LinkRouterBlock({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as unknown as RouterNodeData;
  const [draftUrl, setDraftUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { resolveAndCreateBlock, cancel } = useRouterBlock({
    nodeId: id,
    nodeData,
  });

  // Auto-focus when selected
  useEffect(() => {
    if (selected && !draftUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, draftUrl]);

  // ESC to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (draftUrl) {
          setDraftUrl('');
          setError(null);
          inputRef.current?.blur();
        } else {
          cancel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draftUrl, cancel]);

  const handleUrlSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!draftUrl.trim() || isResolving) return;

      const resolution = resolveUrlToBlockConfig(draftUrl.trim());
      if (!resolution) {
        setError('Please enter a valid URL');
        return;
      }

      setIsResolving(true);
      setError(null);

      try {
        await resolveAndCreateBlock(
          resolution.blockType,
          resolution.initialProperties as Record<string, unknown>
        );
      } catch (err) {
        console.error('[LinkRouterBlock] Failed to create block:', err);
        setError('Failed to create block');
        setIsResolving(false);
      }
    },
    [draftUrl, isResolving, resolveAndCreateBlock]
  );

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftUrl(e.target.value);
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleUrlSubmit();
      }
    },
    [handleUrlSubmit]
  );

  return (
    <>
      <Box
        className={`
          w-full h-full rounded-lg border border-border bg-background
          overflow-hidden flex flex-col
        `}
        style={{
          width: LINK_ROUTER_SIZE.width,
          height: LINK_ROUTER_SIZE.height,
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box className="relative w-full h-full flex flex-col">
          <LinkLoadingState />

          <Box className="absolute inset-0 backdrop-blur-xs bg-white/5 dark:bg-black/40 flex flex-col items-center justify-center p-4 z-10">
            <LinkIcon className="h-12 w-12 shrink-0 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-3">
              Enter URL
            </p>
            <form
              onSubmit={handleUrlSubmit}
              className="w-full max-w-sm"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Input
                ref={inputRef}
                type="url"
                placeholder="https://..."
                value={draftUrl}
                disabled={isResolving}
                className="border-ring ring-ring/50 ring-[3px]"
                onChange={handleUrlChange}
                onKeyDown={handleKeyDown}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
              {error && (
                <p className="text-xs text-destructive mt-2 text-center">
                  {error}
                </p>
              )}
              <p className="text-xs text-foreground/80 text-center mt-2">
                Press Enter to save · ESC to cancel
              </p>
            </form>
          </Box>
        </Box>
      </Box>
    </>
  );
});
