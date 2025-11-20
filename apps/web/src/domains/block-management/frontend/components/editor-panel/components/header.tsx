/**
 * Editor Panel Header
 */

'use client';

import { ChevronsRight, Expand, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorPanelContext } from '../core/context';

export function Header() {
  const { onClose } = useEditorPanelContext();

  return (
    <div className="shrink-0 flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95 group"
          onClick={onClose}
          aria-label="Close editor panel"
        >
          <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            console.log('Expand modal');
          }}
          aria-label="Expand panel"
        >
          <Expand className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            console.log('Share');
          }}
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            console.log('More options');
          }}
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
