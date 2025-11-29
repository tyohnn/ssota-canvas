/**
 * Plan Phase Edges
 *
 * Phase 0 (Plan)의 엣지 정의
 */

import type { Edge } from '@xyflow/react';

export const AUDIO_TO_MARKDOWN_EDGE: Edge = {
  id: 'e1-2',
  type: 'custom',
  source: 'audio-meeting',
  target: 'markdown-meeting-notes',
  sourceHandle: 'right',
  targetHandle: 'left',
  data: {
    edgeId: 'e1-2',
    actualEdgeShape: 'default',
  },
};

export const UF_LANDING_TO_SIGNUP_EDGE: Edge = {
  id: 'e-uf-1',
  type: 'custom',
  source: 'uf-landing',
  target: 'uf-signup',
  sourceHandle: 'right',
  targetHandle: 'left',
  data: {
    edgeId: 'e-uf-1',
    actualEdgeShape: 'default',
  },
};

export const UF_SIGNUP_TO_ONBOARDING_EDGE: Edge = {
  id: 'e-uf-2',
  type: 'custom',
  source: 'uf-signup',
  target: 'uf-onboarding',
  sourceHandle: 'right',
  targetHandle: 'left',
  data: {
    edgeId: 'e-uf-2',
    actualEdgeShape: 'default',
  },
};

export const UF_ONBOARDING_TO_WORKSPACE_EDGE: Edge = {
  id: 'e-uf-3',
  type: 'custom',
  source: 'uf-onboarding',
  target: 'uf-create-workspace',
  sourceHandle: 'right',
  targetHandle: 'left',
  data: {
    edgeId: 'e-uf-3',
    actualEdgeShape: 'default',
  },
};

export const UF_WORKSPACE_TO_CANVAS_EDGE: Edge = {
  id: 'e-uf-4',
  type: 'custom',
  source: 'uf-create-workspace',
  target: 'uf-first-canvas',
  sourceHandle: 'right',
  targetHandle: 'left',
  data: {
    edgeId: 'e-uf-4',
    actualEdgeShape: 'default',
  },
};

// 애니메이션 순서대로 엣지 배열
// 블록 순서: Audio(0) -> Markdown(1) -> Title(2) -> UF1(3) -> UF2(4) -> UF3(5) -> UF4(6) -> UF5(7)
// 엣지는 관련 블록들이 나타난 후에 표시
export const PLAN_PHASE_EDGES_SEQUENCE = [
  AUDIO_TO_MARKDOWN_EDGE, // Audio(0) + Markdown(1) 나타난 후 -> index 0
  UF_LANDING_TO_SIGNUP_EDGE, // UF1(3) + UF2(4) 나타난 후 -> index 1
  UF_SIGNUP_TO_ONBOARDING_EDGE, // UF2(4) + UF3(5) 나타난 후 -> index 2
  UF_ONBOARDING_TO_WORKSPACE_EDGE, // UF3(5) + UF4(6) 나타난 후 -> index 3
  UF_WORKSPACE_TO_CANVAS_EDGE, // UF4(6) + UF5(7) 나타난 후 -> index 4
];
