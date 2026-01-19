'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Share, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useShare } from '@/domains/share/frontend/hooks/use-share';
import { Box } from '@/components/ui/box';

import { DuplicateDialog } from './duplicate-dialog';

export interface PublishedPageHeaderProps {
  title: string;
  publishToken: string;
}

/**
 * Published Page Header Component
 *
 * 공개 페이지 전용 헤더 컴포넌트
 * - Copy Link, Copy 버튼 등 공개 페이지 전용 UI
 */
export function PublishedPageHeader({
  title,
  publishToken,
}: PublishedPageHeaderProps) {
  const { copyLinkToClipboard } = useShare();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/p/${publishToken}`;
      await copyLinkToClipboard(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 bg-background z-20">
      <Box className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg hover:opacity-80 transition-opacity">
          ssota
        </Link>
        <h1 className="text-base font-semibold truncate max-w-[300px]">
          {title || 'Untitled'}
        </h1>
      </Box>
      <Box className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                className="relative"
              >
                <Box
                  className={cn(
                    'transition-all',
                    isCopied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
                  )}
                >
                  <Share size={16} />
                </Box>
                <Box
                  className={cn(
                    'absolute transition-all',
                    isCopied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                  )}
                >
                  <Check size={16} className="stroke-emerald-500" />
                </Box>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCopied ? 'Link Copied' : 'Copy Link'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DuplicateDialog publishToken={publishToken} />
      </Box>
    </header>
  );
}
