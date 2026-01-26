import React from 'react';
import type { Edge } from '@xyflow/react';
import { getPublishedPageAction } from '@/domains/share/actions/get-published-page.action';
import {
  type CustomNodeType,
  sortNodesForReactFlow,
  toReactFlowEdgeFromCanvasView,
  toReactFlowNodeFromCanvasView,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { PublishPageClient } from '@/domains/share/frontend/components/publish-page-client';
import { Box } from '@/components/ui/box';

interface PublishPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublishPage({ params }: PublishPageProps) {
  const { token } = await params;

  // 서버에서 초기 데이터를 가져옵니다 (공식 Action 함수 활용)
  const result = await getPublishedPageAction(token);

  if (!result.success) {
    return (
      <Box className="h-screen flex items-center justify-center bg-background">
        <Box className="text-center space-y-4 max-w-md">
          <Box className="text-destructive text-5xl">⚠️</Box>
          <h2 className="text-2xl font-bold text-foreground">Failed to load page</h2>
          <p className="text-muted-foreground">
            {result.error || 'Failed to load published page'}
          </p>
        </Box>
      </Box>
    );
  }

  const initialData = result.data;

  // ACL 변환: CanvasViewData → React Flow 초기 데이터 (서버에서 처리)
  // 부모 노드가 자식보다 먼저 오도록 정렬 (React Flow 요구사항)
  const unsortedNodes: CustomNodeType[] = initialData.blocks.map(block =>
    toReactFlowNodeFromCanvasView(block)
  );
  const initialNodes = sortNodesForReactFlow(unsortedNodes);

  const initialEdges: Edge[] = (initialData.edges || []).map(edge =>
    toReactFlowEdgeFromCanvasView(edge)
  );

  return (
    <PublishPageClient
      token={token}
      title={initialData.title}
      icon={initialData.icon}
      pageId={initialData.pageId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}
