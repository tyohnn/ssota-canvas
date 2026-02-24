/**
 * Canvas Load Error Canvas
 *
 * Same canvas-style layout as the not-found page: center hexagon.
 * Shown when canvas data fails to load (e.g. in /r/[orgId]/[pageId]).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import type { Node } from '@xyflow/react';

import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';

import { NotFoundCanvasContent } from './not-found-canvas-content';

const CENTER_BLOCK: Node = {
  id: 'not-found-hexagon',
  type: 'not-found-hexagon',
  position: { x: 350, y: 280 },
  data: {
    blockId: 'not-found-hexagon',
    blockMountId: 'not-found-hexagon',
    blockType: 'shape',
    title: "Couldn't load",
    properties: {},
    customProperties: [],
  },
  width: 280,
  height: 180,
};

export interface CanvasLoadErrorCanvasProps {
  error?: string;
  orgId?: string;
}

export function CanvasLoadErrorCanvas({ error, orgId }: CanvasLoadErrorCanvasProps) {
  const nodes = useMemo(() => [CENTER_BLOCK], []);
  const [mounted, setMounted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const textTimer = setTimeout(() => setShowText(true), 500);
    const buttonTimer = setTimeout(() => setShowButtons(true), 700);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
    };
  }, [mounted]);

  const backHref = orgId ? `/r/${orgId}` : '/r';

  return (
    <div className="flex-1 relative overflow-hidden bg-background">
      <div className="absolute inset-0 h-full">
        <NotFoundCanvasContent nodes={nodes} />
      </div>

      <div className="absolute inset-0 h-full pointer-events-none">
        <div className="h-full flex flex-col items-center justify-end pb-36">
          <p
            className={cn(
              'text-muted-foreground text-center mb-6 max-w-md px-4',
              'transition-all duration-700 ease-out',
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {error ?? 'Unable to load canvas data.'}
          </p>

          <div
            className={cn(
              'flex gap-4 pointer-events-auto',
              'transition-all duration-700 ease-out',
              showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Button asChild variant="outline" size="lg" className="cursor-pointer">
              <Link href={backHref}>Back to workspace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
