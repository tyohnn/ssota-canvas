/**
 * Design Phase Edges
 *
 * Phase 1 (Design)의 엣지 정의
 * Button 블록들과 Form 블록 간의 연결
 */

import type { Edge } from '@xyflow/react';

// Button Default → Form with Buttons
export const BUTTON_DEFAULT_TO_FORM_EDGE: Edge = {
  id: 'edge-button-default-form',
  source: 'design-button-default',
  target: 'design-form-buttons',
  type: 'custom',
  data: {
    edgeShape: 'default',
    actualEdgeShape: 'default',
  },
};

// Button Outline → Form with Buttons
export const BUTTON_OUTLINE_TO_FORM_EDGE: Edge = {
  id: 'edge-button-outline-form',
  source: 'design-button-outline',
  target: 'design-form-buttons',
  type: 'custom',
  data: {
    edgeShape: 'default',
    actualEdgeShape: 'default',
  },
};

// Button Destructive → Form with Buttons
export const BUTTON_DESTRUCTIVE_TO_FORM_EDGE: Edge = {
  id: 'edge-button-destructive-form',
  source: 'design-button-destructive',
  target: 'design-form-buttons',
  type: 'custom',
  data: {
    edgeShape: 'default',
    actualEdgeShape: 'default',
  },
};

// Export all edges as a sequence
export const DESIGN_PHASE_EDGES_SEQUENCE = [
  BUTTON_DEFAULT_TO_FORM_EDGE,
  BUTTON_OUTLINE_TO_FORM_EDGE,
  BUTTON_DESTRUCTIVE_TO_FORM_EDGE,
];
