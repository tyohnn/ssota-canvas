'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Box } from '@/components/ui/box';

interface UnpublishedContentProps {
  isSubmitting: boolean;
  onPublish: () => void;
  onClose: () => void;
}

export function UnpublishedContent({
  isSubmitting,
  onPublish,
  onClose,
}: UnpublishedContentProps) {
  return (
    <Box className="space-y-6">
      <Box>
        <Box className="space-y-4">
          <Box className="space-y-1">
            <h3 className="text-sm font-semibold">Publish to Web</h3>
            <p className="text-xs text-muted-foreground">
              Published pages can be accessed by anyone with the link.
            </p>
          </Box>

          <Box className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <Box className="rounded-md border border-border/60 bg-background">
              <Box className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              </Box>
              <Box className="px-3 pb-3 pt-1 space-y-2">
                <div className="h-2 w-24 rounded-full bg-muted-foreground/30" />
                <div className="h-2 w-32 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-20 rounded-full bg-muted-foreground/20" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onPublish}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </Button>
      </Box>
    </Box>
  );
}
