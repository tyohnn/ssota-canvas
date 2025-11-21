import { getCanvasViewAction } from '@/domains/canvas-management/actions/canvas-query.actions';
import {
  toReactFlowNodeFromCanvasView,
  toReactFlowEdgeFromCanvasView,
  type CustomNodeType,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { CanvasClient } from '@/domains/canvas-management/frontend/components/core/canvas-client';
import type { Edge } from '@xyflow/react';

interface WorkspacePageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * 랜덤 블록 생성 (서버 컴포넌트 호환)
 * 매번 새로고침할 때마다 다른 위치 생성
 */
function generateRandomBlocks() {
  const blocks = [];
  const blockCount = 6;

  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: 50 + Math.random() * 800, // 50~850px
      y: 50 + Math.random() * 400, // 50~450px
      width: 200 + Math.random() * 150, // 200~350px
      height: 100 + Math.random() * 100, // 100~200px
      delay: i * 50, // 순차적 애니메이션 딜레이
    });
  }

  return blocks;
}

/**
 * Canvas Loading Skeleton
 *
 * React Flow 스타일의 캔버스 배경에 스켈레톤 블록들을 표시
 * - 매 렌더링마다 랜덤한 위치에 블록 배치
 */
function CanvasLoadingSkeleton() {
  // 서버에서 실행되므로 매번 새로운 랜덤 블록 생성
  const skeletonBlocks = generateRandomBlocks();

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* React Flow 스타일 배경 (Dot Pattern) */}
      <div className="absolute inset-0 bg-background">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="dot-pattern"
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
            fill="url(#dot-pattern)"
          />
        </svg>
      </div>

      {/* 스켈레톤 블록들 */}
      <div className="absolute inset-0">
        {skeletonBlocks.map((block, index) => (
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
              {block.height > 120 && (
                <>
                  <div className="h-3 bg-muted/40 rounded w-4/6"></div>
                  <div className="h-3 bg-muted/40 rounded w-full"></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 중앙 로딩 인디케이터 (반투명 오버레이) */}
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

/**
 * Canvas Error Fallback
 */
function CanvasErrorFallback({ error }: { error: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-destructive text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground">캔버스 로드 실패</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}

/**
 * 페이지의 캔버스 콘텐츠를 렌더링하는 서버 컴포넌트
 */
async function PageContent({
  pageId,
  orgId,
  workspaceId,
}: {
  pageId: string;
  orgId: string;
  workspaceId: string;
}) {
  const canvasViewResult = await getCanvasViewAction(
    pageId,
    orgId,
    workspaceId
  );

  if (!canvasViewResult.success) {
    return (
      <CanvasErrorFallback
        error={canvasViewResult.error || '캔버스 데이터를 불러올 수 없습니다.'}
      />
    );
  }

  const canvasViewData = canvasViewResult.data;

  // ACL 변환: CanvasViewData → React Flow 초기 데이터
  const initialNodes: CustomNodeType[] = canvasViewData.blocks.map(block =>
    toReactFlowNodeFromCanvasView(block, {
      pageId,
      orgId,
      workspaceId,
    })
  );

  const initialEdges: Edge[] = canvasViewData.edges.map(edge =>
    toReactFlowEdgeFromCanvasView(edge)
  );

  return (
    <CanvasClient
      pageId={pageId}
      orgId={orgId}
      workspaceId={workspaceId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}

/**
 * 페이지 렌더링
 *
 * - URL이 Single Source of Truth
 * - Suspense는 layout.tsx에서 관리 (로딩 단계 통합)
 * - CanvasClient를 사용하여 캔버스 렌더링
 */
export default async function WorkspacePageRoute({
  params,
}: WorkspacePageProps) {
  const { orgId, workspaceId, pageId } = await params;

  if (!pageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">페이지를 선택해주세요</p>
      </div>
    );
  }

  // Suspense는 layout.tsx에서 처리되므로 직접 렌더링
  return (
    <PageContent pageId={pageId} orgId={orgId} workspaceId={workspaceId} />
  );
}
