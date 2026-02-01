/**
 * Mock Argument Map Data
 *
 * Static mock data for Argument Map based on YouTube video "How To Get Your First Users"
 * Structure follows argument-map.template.ts specification
 */

export interface ArgumentMapNode {
  id: string;
  type: 'shape' | 'markdown';
  shapeType?: 'ellipse' | 'rectangle' | 'diamond';
  color?: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  title: string;
  content?: string;
  position?: { x: number; y: number };
}

export interface ArgumentMapEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'top' | 'bottom' | 'left' | 'right';
  targetHandle?: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  stroke: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';
  shape?: 'default' | 'straight' | 'step' | 'smoothstep';
  markerEnd?: 'arrow' | 'arrowclosed';
}

// Thesis (purple ellipse)
export const THESIS_NODE: ArgumentMapNode = {
  id: 'thesis_main',
  type: 'shape',
  shapeType: 'ellipse',
  color: 'purple',
  title: 'Build a Minimum Evolvable Product',
  content: 'Startups must build a minimum evolvable product that adapts to early user feedback, treating user acquisition as a search problem rather than persuasion.',
};

// Claims (different colored rectangles)
export const CLAIM_NODES: ArgumentMapNode[] = [
  {
    id: 'claim_1',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'green',
    title: 'Search for Early Adopters',
    content: 'Target rare individuals like Gustafs with burning needs through personal outreach, not broad marketing. Acquisition is a search problem, not persuasion.',
  },
  {
    id: 'claim_2',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'blue',
    title: 'Charge Real Money Early',
    content: 'Charge real money from day one. Paying customers provide sharper feedback than free users. Revenue is secondary; validation comes from real stakes.',
  },
  {
    id: 'claim_3',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'amber',
    title: 'Iterate Fast Without Fear',
    content: 'Study users anthropologically, run constant experiments, and don\'t fear churn. Early relationships are direct, and irrelevance (not headlines) is the foe.',
  },
];

// Evidence (dashed rectangles, same color as parent claim)
export const EVIDENCE_NODES: ArgumentMapNode[] = [
  {
    id: 'evidence_1_1',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'green',
    borderStyle: 'dashed',
    title: 'Gustaf at Airbnb',
    content: 'Gustaf at Airbnb loved testing startups and introducing them company-wide. These rare early adopters exist despite widespread resistance.',
  },
  {
    id: 'evidence_1_2',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'green',
    borderStyle: 'dashed',
    title: 'Burning Problem Solvers',
    content: 'Others try anything solving a burning issue, like paying a startup for a quick inference API billing solution within 3 days.',
  },
  {
    id: 'evidence_2_1',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'blue',
    borderStyle: 'dashed',
    title: 'Sharper Feedback from Payers',
    content: 'Paying customers provide sharper feedback than free users. Angry high-payers motivate more than indifferent free users.',
  },
  {
    id: 'evidence_3_1',
    type: 'shape',
    shapeType: 'rectangle',
    color: 'amber',
    borderStyle: 'dashed',
    title: 'Churn is Fine',
    content: 'Churn is fine—relationships are direct, and irrelevance (not headlines) is the foe. Startups win by iterating unseen, unlike big companies.',
  },
];

// Counterpoint (red diamond)
export const COUNTERPOINT_NODES: ArgumentMapNode[] = [
  {
    id: 'counterpoint_1',
    type: 'shape',
    shapeType: 'diamond',
    color: 'red',
    title: 'Most People Resist New Products',
    content: 'Few people join as a startup\'s first 10 users or paying customers, as most avoid unproven products.',
  },
];

// Action Plan (markdown)
export const ACTION_PLAN_NODE: ArgumentMapNode = {
  id: 'action_plan',
  type: 'markdown',
  title: 'Action: Personal Outreach to Pioneers',
  content: `## Action Plan

1. **Search personally** for desperate pioneers with burning problems
2. **Charge early** to get real validation and sharper feedback
3. **Launch fast** to maximize surface area for unknown early users
4. **Iterate relentlessly** without fearing churn
5. **Study anthropologically** - analyze decisions, trust factors, and desires

Early users don't just provide feedback—they path-dependently evolve the product via their preferences.`,
};

// All nodes combined
export const ARGUMENT_MAP_NODES: ArgumentMapNode[] = [
  THESIS_NODE,
  ...CLAIM_NODES,
  ...EVIDENCE_NODES,
  ...COUNTERPOINT_NODES,
  ACTION_PLAN_NODE,
];

// Edges: handle 기반 연결
// - contradict: counterpoint bottom -> thesis top
// - thesis bottom -> claims top, action top
// - claims bottom -> evidence top
export const ARGUMENT_MAP_EDGES: ArgumentMapEdge[] = [
  // Counterpoint (bottom) -> Thesis (top)
  {
    id: 'edge_counterpoint_thesis',
    source: 'counterpoint_1',
    target: 'thesis_main',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'contradicts',
    stroke: 'red',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  // Thesis (bottom) -> Claims (top) + Action Plan (top)
  {
    id: 'edge_thesis_claim_1',
    source: 'thesis_main',
    target: 'claim_1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'supports',
    stroke: 'purple',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_thesis_claim_2',
    source: 'thesis_main',
    target: 'claim_2',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'supports',
    stroke: 'purple',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_thesis_claim_3',
    source: 'thesis_main',
    target: 'claim_3',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'supports',
    stroke: 'purple',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_thesis_action',
    source: 'thesis_main',
    target: 'action_plan',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'leads to',
    stroke: 'purple',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  // Claims (bottom) -> Evidence (top)
  {
    id: 'edge_claim_1_evidence_1_1',
    source: 'claim_1',
    target: 'evidence_1_1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'based on',
    stroke: 'green',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_claim_1_evidence_1_2',
    source: 'claim_1',
    target: 'evidence_1_2',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'based on',
    stroke: 'green',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_claim_2_evidence_2_1',
    source: 'claim_2',
    target: 'evidence_2_1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'based on',
    stroke: 'blue',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
  {
    id: 'edge_claim_3_evidence_3_1',
    source: 'claim_3',
    target: 'evidence_3_1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'based on',
    stroke: 'amber',
    shape: 'smoothstep',
    markerEnd: 'arrowclosed',
  },
];

// Group block ID (gray container, created first)
export const GROUP_NODE_ID = 'argument_map_group';
export const THESIS_NODE_ID = 'thesis_main';

// Group block position (absolute on canvas) - YouTube(100,80 400x260) 우측으로 넉넉히
export const GROUP_POSITION = { x: 620, y: 50 };
// 그룹 크기: DAG tree 레이아웃 (계층 간격 2배)
export const GROUP_SIZE = { width: 1180, height: 1100 };

// Block positions relative to group (parentId = GROUP_NODE_ID)
// DAG tree 레이아웃: 계층 간 간격 2배 (280-320px)
const P = 30;
export const ARGUMENT_MAP_LAYOUT_RELATIVE: Record<string, { x: number; y: number }> = {
  // Level 0: counterpoint (상단 우측)
  counterpoint_1: { x: 600 + P, y: P },

  // Level 1: thesis (중앙)
  thesis_main: { x: 320 + P, y: 280 + P },

  // Level 2: claims (3개 수평 배치) + action_plan (우측 끝)
  claim_1: { x: 80 + P, y: 600 + P },
  claim_2: { x: 320 + P, y: 600 + P },
  claim_3: { x: 560 + P, y: 600 + P },
  action_plan: { x: 820 + P, y: 600 + P },          // claim 계층 우측 끝

  // Level 3: evidence (각 claim 아래)
  evidence_1_1: { x: P, y: 920 + P },
  evidence_1_2: { x: 160 + P, y: 920 + P },
  evidence_2_1: { x: 320 + P, y: 920 + P },
  evidence_3_1: { x: 560 + P, y: 920 + P },
};

// Block rendering order for sequential animation (group first, then blocks)
// counterpoint -> thesis -> claims -> evidence -> action_plan
export const BLOCK_RENDERING_ORDER = [
  GROUP_NODE_ID,
  'counterpoint_1',
  'thesis_main',
  'claim_1',
  'claim_2',
  'claim_3',
  'evidence_1_1',
  'evidence_1_2',
  'evidence_2_1',
  'evidence_3_1',
  'action_plan',
];

// Edge rendering order (after all blocks are visible)
export const EDGE_RENDERING_ORDER = ARGUMENT_MAP_EDGES.map(edge => edge.id);
