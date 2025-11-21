'use client';

import React from 'react';

/**
 * 고정된 위치의 블록 생성 (Hydration Mismatch 방지)
 * 자연스럽게 흩어진 형태의 레이아웃
 */
const FIXED_BLOCKS = [
  // 왼쪽 상단 그룹
  { x: 80, y: 60, width: 240, height: 140, delay: 0 },
  { x: 120, y: 240, width: 200, height: 120, delay: 100 },

  // 중앙 상단 그룹
  { x: 420, y: 80, width: 280, height: 160, delay: 200 },
  { x: 380, y: 280, width: 220, height: 140, delay: 300 },

  // 오른쪽 그룹 (화면 밖으로 나갈 수도 있음)
  { x: 780, y: 100, width: 260, height: 180, delay: 400 },
  { x: 720, y: 320, width: 240, height: 130, delay: 500 },

  // 하단 그룹
  { x: 200, y: 450, width: 300, height: 150, delay: 600 },
  { x: 580, y: 480, width: 280, height: 140, delay: 700 },
];

/**
 * Canvas Loading Skeleton
 *
 * 랜덤 블록 위치로 실제 캔버스처럼 보이는 로딩 화면
 * 모든 캔버스 로딩 상태에서 공통으로 사용
 */
export function CanvasLoadingSkeleton() {
  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* React Flow 스타일 배경 (Dot Pattern) */}
      <div className="absolute inset-0 bg-background">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="canvas-dot-pattern"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1"
                cy="1"
                r="1"
                className="fill-muted-foreground/20 dark:fill-muted-foreground/10"
              />
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#canvas-dot-pattern)"
          />
        </svg>
      </div>

      {/* 스켈레톤 블록들 */}
      <div className="absolute inset-0">
        {FIXED_BLOCKS.map((block, index) => (
          <div
            key={index}
            className="absolute rounded-lg border border-border bg-card shadow-sm animate-pulse"
            style={{
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${block.height}px`,
              animationDelay: `${block.delay}ms`,
              animationDuration: '2s',
            }}
          >
            {/* 블록 내부 콘텐츠 스켈레톤 */}
            <div className="p-4 space-y-3 h-full">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted/60 rounded w-full"></div>
              <div className="h-3 bg-muted/60 rounded w-5/6"></div>
              {block.height > 130 && (
                <>
                  <div className="h-3 bg-muted/40 rounded w-4/6"></div>
                  <div className="h-3 bg-muted/40 rounded w-full"></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 중앙 로딩 인디케이터 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-foreground">
              캔버스를 로딩하고 있습니다...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
