/**
 * Animated Canvas Data Hook
 *
 * 시간 간격으로 블록과 엣지를 순차적으로 추가하는 애니메이션 효과
 * 한번 나타난 블록은 계속 유지됨
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface AnimationConfig {
  blockDelay: number; // 블록 간 딜레이 (ms)
  edgeDelay: number; // 엣지 간 딜레이 (ms)
  startDelay: number; // 시작 전 딜레이 (ms)
}

interface UseAnimatedCanvasDataParams {
  blocks: Node[];
  edges: Edge[];
  config?: Partial<AnimationConfig>;
  enabled?: boolean; // 애니메이션 활성화 여부
}

const DEFAULT_CONFIG: AnimationConfig = {
  blockDelay: 300, // 블록 간 300ms
  edgeDelay: 200, // 엣지 간 200ms
  startDelay: 1000, // 시작 전 1400ms (헤더 애니메이션 완료 후: 헤더(200ms+600ms) + 서브텍스트(600ms) = 1400ms)
};

export function useAnimatedCanvasData({
  blocks,
  edges,
  config = {},
  enabled = true,
}: UseAnimatedCanvasDataParams) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [visibleBlocks, setVisibleBlocks] = useState<Node[]>(
    enabled ? [] : blocks
  );
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>(
    enabled ? [] : edges
  );

  useEffect(() => {
    if (!enabled) {
      // 애니메이션 비활성화 시 모든 블록/엣지 즉시 표시
      setVisibleBlocks(blocks);
      setVisibleEdges(edges);
      return;
    }

    // 애니메이션 실행
    setVisibleBlocks([]);
    setVisibleEdges([]);

    const timers: NodeJS.Timeout[] = [];

    // 블록 순차 추가
    blocks.forEach((block, index) => {
      const timer = setTimeout(
        () => {
          setVisibleBlocks(prev => [...prev, block]);
        },
        finalConfig.startDelay + index * finalConfig.blockDelay
      );
      timers.push(timer);
    });

    // 엣지 순차 추가
    // 첫 번째 엣지(audio-markdown): 블록 2개(0,1) 나타난 후
    // 나머지 UF 엣지들: 해당 블록들이 나타난 후
    edges.forEach((edge, index) => {
      let edgeStartTime;

      if (index === 0) {
        // 첫 번째 엣지: 블록 2개 나타난 후 (audio + markdown)
        edgeStartTime =
          finalConfig.startDelay +
          2 * finalConfig.blockDelay +
          finalConfig.edgeDelay;
      } else {
        // UF 엣지들: 블록 4개(0,1,2,3) + 해당 UF 블록들 나타난 후
        const ufBlockStartIndex = 3; // Title 이후 첫 UF 블록
        const ufEdgeIndex = index - 1; // 첫 엣지는 audio-markdown이므로 -1
        edgeStartTime =
          finalConfig.startDelay +
          (ufBlockStartIndex + ufEdgeIndex + 2) * finalConfig.blockDelay +
          finalConfig.edgeDelay;
      }

      const timer = setTimeout(() => {
        setVisibleEdges(prev => [...prev, edge]);
      }, edgeStartTime);
      timers.push(timer);
    });

    // 클린업
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [
    blocks,
    edges,
    enabled,
    finalConfig.startDelay,
    finalConfig.blockDelay,
    finalConfig.edgeDelay,
  ]);

  return {
    nodes: visibleBlocks,
    edges: visibleEdges,
    isAnimationComplete:
      visibleBlocks.length === blocks.length &&
      visibleEdges.length === edges.length,
  };
}
