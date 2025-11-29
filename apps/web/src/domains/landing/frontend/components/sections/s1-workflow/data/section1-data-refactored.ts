/**
 * Section 1 Data (Refactored)
 *
 * Section 1 (For Software Development)의 블록 데이터 정의
 * Plan → Design → Develop → Deploy
 *
 * 개선사항:
 * - 블록과 엣지를 상수로 분리
 * - 애니메이션 시퀀스 지원
 */

'use client';

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { CanvasMode } from '@/domains/canvas-management/frontend/contexts/canvas-mode-context';
import { SSOTA_HEXAGON_BLOCK } from './blocks/intro-block';
import { PLAN_PHASE_BLOCKS_SEQUENCE } from './blocks/plan-phase-blocks';
import { PLAN_PHASE_EDGES_SEQUENCE } from './edges/plan-phase-edges';

interface Section1Data {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId?: string;
  canvasMode: CanvasMode['type'];
}

/**
 * Section 1: For Software Development (4 phases)
 * Plan → Design → Develop → Deploy
 */
export function useSection1Data(subPhase: number): Section1Data {
  return useMemo(() => {
    switch (subPhase) {
      case 0: // Intro: SSOTA Hexagon만
        return {
          nodes: [SSOTA_HEXAGON_BLOCK],
          edges: [],
          viewport: { x: -500, y: -300, zoom: 2 },
          canvasMode: 'default',
        };

      case 1: // Phase 1: Plan (with animation)
        return {
          nodes: PLAN_PHASE_BLOCKS_SEQUENCE,
          edges: PLAN_PHASE_EDGES_SEQUENCE,
          viewport: { x: 40, y: -150, zoom: 0.9 },
          canvasMode: 'default',
        };

      case 2: // Phase 2: Design
      case 3: // Phase 3: Develop
      case 4: // Phase 4: Deploy
        // TODO: Implement other phases
        return {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          canvasMode: 'default',
        };

      default:
        return {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          canvasMode: 'default',
        };
    }
  }, [subPhase]);
}

/**
 * Get block sequence for animation
 */
export function useSection1AnimationSequence(subPhase: number) {
  return useMemo(() => {
    switch (subPhase) {
      case 0: // Intro: SSOTA 블록 애니메이션
        return {
          blocks: [SSOTA_HEXAGON_BLOCK],
          edges: [],
          enableAnimation: true, // 헤더 애니메이션 완료 후 등장
        };
      case 1: // Phase 1: Plan (with animation)
        return {
          blocks: PLAN_PHASE_BLOCKS_SEQUENCE,
          edges: PLAN_PHASE_EDGES_SEQUENCE,
          enableAnimation: true,
        };
      default:
        return {
          blocks: [],
          edges: [],
          enableAnimation: false,
        };
    }
  }, [subPhase]);
}
