'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePublishFlow } from './hooks/use-publish-flow';
import { PublishInfoCard } from './components/publish-info-card';
import { PublishSettings } from './components/publish-settings';

interface PublishFlowProps {
  pageId: string;
  isPublishable: boolean;
  onPublished?: (publishUrl: string) => void;
}

export function PublishFlow(props: PublishFlowProps) {
  const { isPublishable } = props;
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
          disabled={!isPublishable}
          title={!isPublishable ? 'You do not have permission to publish' : undefined}
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
        <div className="border-b border-border/60 px-4 pt-3">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="relative pb-2 text-foreground">
              Publish
              <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-foreground" />
            </span>
          </div>
        </div>

        <div className="space-y-6 px-4 py-4">
          <PublishInfoCard />
          
          <PublishSettings 
            publishUrl={publishUrl}
            normalizedUrl={normalizedUrl}
            isSubmitting={isSubmitting}
            isUnpublishing={isUnpublishing}
            isLinkCopied={isLinkCopied}
            onPublish={handlePublish}
            onCopy={handleCopy}
            onUnpublish={handleUnpublish}
            onClose={() => setIsOpen(false)}
          />

          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
