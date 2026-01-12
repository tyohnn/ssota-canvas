'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';

interface PublishSettingsProps {
  publishUrl: string | null;
  normalizedUrl: string | null;
  isSubmitting: boolean;
  isUnpublishing: boolean;
  isLinkCopied: boolean;
  onPublish: () => void;
  onCopy: () => void;
  onUnpublish: () => void;
  onClose: () => void;
}

export function PublishSettings({
  publishUrl,
  normalizedUrl,
  isSubmitting,
  isUnpublishing,
  isLinkCopied,
  onPublish,
  onCopy,
  onUnpublish,
  onClose,
}: PublishSettingsProps) {
  if (publishUrl) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-border/60 bg-background px-3 py-2">
          <input
            type="text"
            readOnly
            value={normalizedUrl ?? ''}
            className="w-full bg-transparent text-xs text-muted-foreground outline-none select-all truncate"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className={`flex-1 flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition-all ${
              isLinkCopied 
                ? 'bg-accent text-accent-foreground shadow-sm' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isLinkCopied ? 'Link Copied' : 'Copy Link'}
          </button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onUnpublish}
            disabled={isUnpublishing}
            className="flex-1"
          >
            Unpublish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        onClick={onPublish}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Publishing...' : 'Publish'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClose}
        className="w-full"
      >
        Close
      </Button>
    </div>
  );
}
