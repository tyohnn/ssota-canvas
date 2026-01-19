import type { Edge } from '@xyflow/react';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

export interface PublishPageClientProps {
  token: string;
  title: string;
  icon?: string;
  pageId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

export interface PublishPageClientViewProps {
  token: string;
  title: string;
  icon?: string;
  pageId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}
