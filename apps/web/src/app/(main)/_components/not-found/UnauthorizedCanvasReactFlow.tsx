/**
 * Unauthorized Canvas (ReactFlow Version)
 *
 * 중앙에 401 Unauthorized 육각형 블록만 표시 (빨간색 primary)
 */

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import type { Node } from '@xyflow/react';

import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';

import { UnauthorizedCanvasContent } from './unauthorized-canvas-content';

// Unauthorized 메인 육각형 블록 (RED/primary)
const UNAUTHORIZED_HEXAGON_BLOCK: Node = {
  id: 'unauthorized-hexagon',
  type: 'unauthorized-hexagon',
  position: { x: 350, y: 280 },
  data: {
    blockId: 'unauthorized-hexagon',
    blockMountId: 'unauthorized-hexagon',
    blockType: 'shape',
    title: '401',
    properties: {},
    customProperties: [],
  },
  width: 280,
  height: 180,
};

export function UnauthorizedCanvasReactFlow() {
  const nodes: Node[] = [UNAUTHORIZED_HEXAGON_BLOCK];

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

  return (
    <div className="flex-1 relative overflow-hidden bg-background">
      <div className="absolute inset-0 h-full">
        <UnauthorizedCanvasContent nodes={nodes} />
      </div>

      <div className="absolute inset-0 h-full pointer-events-none">
        <div className="h-full flex flex-col items-center justify-end pb-36">
          <p
            className={cn(
              'text-muted-foreground text-center mb-6 max-w-md px-4',
              'transition-all duration-700 ease-out',
              showText
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            You don&apos;t have permission to access this page.
          </p>

          <div
            className={cn(
              'flex gap-4 pointer-events-auto',
              'transition-all duration-700 ease-out',
              showButtons
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            <Button asChild variant="default" size="lg" className="cursor-pointer">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
