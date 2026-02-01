'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const COPY_FEEDBACK_MS = 1500;

interface PublishedContentProps {
  normalizedUrl: string | null;
  isUnpublishing: boolean;
  isLinkCopied: boolean;
  onCopy: () => void;
  onUnpublish: () => void;
}

export function PublishedContent({
  normalizedUrl,
  isUnpublishing,
  isLinkCopied,
  onCopy,
  onUnpublish,
}: PublishedContentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // isLinkCopied가 true가 되면 체크 표시 후 2초 뒤 복사 아이콘으로 복귀.
  // 부모가 그 전에 isLinkCopied를 false로 바꿔도 타이머는 취소하지 않고 유지.
  useEffect(() => {
    if (isLinkCopied) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setCopied(true);
      resetTimerRef.current = setTimeout(() => {
        setCopied(false);
        resetTimerRef.current = null;
      }, COPY_FEEDBACK_MS);
    }
  }, [isLinkCopied]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      onCopy();
    }
  };

  const handleVisit = () => {
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Box className="space-y-3">
      <Box className="relative">
        <Input
          type="text"
          readOnly
          value={normalizedUrl ?? ''}
          ref={inputRef}
          className="select-all pe-9 text-xs text-muted-foreground"
        />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={copied ? 'Copied' : 'Copy to clipboard'}
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed"
                disabled={copied}
                onClick={handleCopy}
                type="button"
              >
                <Box
                  className={cn(
                    'transition-all',
                    copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                  )}
                >
                  <CheckIcon
                    aria-hidden="true"
                    className="stroke-emerald-500"
                    size={16}
                  />
                </Box>
                <Box
                  className={cn(
                    'absolute transition-all',
                    copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
                  )}
                >
                  <CopyIcon aria-hidden="true" size={16} />
                </Box>
              </button>
            </TooltipTrigger>
            <TooltipContent className="z-100 px-2 py-1 text-xs">
              Copy to clipboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Box>
      <Box className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onUnpublish}
          disabled={isUnpublishing}
          className="flex-1 bg-destructive text-destructive-foreground
          hover:bg-destructive/90 hover:text-destructive-foreground"
        >
          Unpublish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleVisit}
          className="flex-1"
        >
          Visit
        </Button>
      </Box>
    </Box>
  );
}
