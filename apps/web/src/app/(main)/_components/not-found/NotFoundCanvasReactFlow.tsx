/**
 * Not Found Canvas (ReactFlow Version)
 *
 * ReactFlow를 활용한 캔버스 스타일 404 페이지
 * - 실제 캔버스와 동일한 블록 시스템 사용
 * - 중앙에 404 육각형 블록
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import type { Node } from '@xyflow/react';

import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';

import { NotFoundCanvasContent } from './not-found-canvas-content';

// 404 메인 육각형 블록
const NOT_FOUND_HEXAGON_BLOCK: Node = {
  id: 'not-found-hexagon',
  type: 'not-found-hexagon',
  position: { x: 350, y: 280 },
  data: {
    blockId: 'not-found-hexagon',
    blockMountId: 'not-found-hexagon',
    blockType: 'shape',
    title: '404',
    properties: {},
    customProperties: [],
  },
  width: 280,
  height: 180,
};

export function NotFoundCanvasReactFlow() {
  const nodes = useMemo(() => [NOT_FOUND_HEXAGON_BLOCK], []);

  // 애니메이션 상태 관리 (서버와 클라이언트에서 동일한 초기값)
  const [mounted, setMounted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // 클라이언트에서만 마운트 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트 후 애니메이션 시작
  useEffect(() => {
    if (!mounted) return;

    // 텍스트는 500ms 후에 나타남
    const textTimer = setTimeout(() => setShowText(true), 500);
    // 버튼은 700ms 후에 나타남
    const buttonTimer = setTimeout(() => setShowButtons(true), 700);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
    };
  }, [mounted]);

  return (
    <div className="flex-1 relative overflow-hidden bg-background">
      {/* ReactFlow Canvas */}
      <div className="absolute inset-0 h-full">
        <NotFoundCanvasContent nodes={nodes} />
      </div>

      {/* 오버레이 콘텐츠 (버튼들) */}
      <div className="absolute inset-0 h-full pointer-events-none">
        <div className="h-full flex flex-col items-center justify-end pb-36">
          {/* 철학 반영 텍스트 */}
          <p
            className={cn(
              'text-muted-foreground text-center mb-6 max-w-md px-4',
              'transition-all duration-700 ease-out',
              showText
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            This page doesn&apos;t exist in our canvas... yet.
          </p>

          {/* CTA 버튼 */}
          <div
            className={cn(
              'flex gap-4 pointer-events-auto',
              'transition-all duration-700 ease-out',
              showButtons
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="cursor-pointer"
            >
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild size="lg" className="cursor-pointer">
              <Link href="/r">Back to Canvas</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
