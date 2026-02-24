'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Box } from '@/components/ui/box';
import { cn } from '@/lib/utils';
import { usePublishFlow } from './core/use-publish-flow';
import { PublishedContent } from './components/published-content';
import { UnpublishedContent } from './components/unpublished-content';

interface PublishPopoverProps {
  pageId: string;
  onPublished?: (publishUrl: string) => void;
}

export function PublishPopover(props: PublishPopoverProps) {
  const {
    isOpen,
    setIsOpen,
    isSubmitting,
    isUnpublishing,
    error,
    publishUrl,
    isLinkCopied,
    normalizedUrl,
    handlePublish,
    handleCopy,
    handleUnpublish,
  } = usePublishFlow(props);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            'h-8 px-3 text-sm font-medium',
            'hover:bg-accent/60 hover:text-accent-foreground'
          )}
        >
          Publish
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 overflow-hidden rounded-xl border border-border/70 shadow-xl"
      >
        <Box className="px-4 pt-3">
          <Box className="flex items-center gap-4 text-sm font-medium">
            <span className="relative pb-2 text-foreground border-b-2 border-foreground">
              Publish
            </span>
          </Box>
        </Box>

        <Box className="px-4 py-4">
          {publishUrl ? (
            <PublishedContent
              normalizedUrl={normalizedUrl}
              isUnpublishing={isUnpublishing}
              isLinkCopied={isLinkCopied}
              onCopy={handleCopy}
              onUnpublish={handleUnpublish}
            />
          ) : (
            <UnpublishedContent
              isSubmitting={isSubmitting}
              onPublish={handlePublish}
              onClose={() => setIsOpen(false)}
            />
          )}

          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </Box>
      </PopoverContent>
    </Popover>
  );
}
