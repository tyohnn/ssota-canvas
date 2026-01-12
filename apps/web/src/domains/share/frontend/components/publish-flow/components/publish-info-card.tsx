'use client';

import React from 'react';

export function PublishInfoCard() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Publish to Web</h3>
        <p className="text-xs text-muted-foreground">
          Published pages can be accessed by anyone with the link.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <div className="rounded-md border border-border/60 bg-background">
          <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          </div>
          <div className="px-3 pb-3 pt-1 space-y-2">
            <div className="h-2 w-24 rounded-full bg-muted-foreground/30" />
            <div className="h-2 w-32 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-20 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
