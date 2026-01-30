/**
 * Canvasdown Executor Hook
 *
 * Canvasdown DSL 텍스트를 받아서 파싱하고 캔버스에 렌더링하는 훅
 * parseCanvasdown 함수를 사용하여 동기적으로 파싱합니다.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { UpdateOperation } from '@ssota-labs/canvasdown';
import type { PatchAppliedResult } from '@ssota-labs/canvasdown-reactflow';
import { parseCanvasdown, useCanvasdownPatch } from '@ssota-labs/canvasdown-reactflow';
import { CanvasdownCore } from '@ssota-labs/canvasdown';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { markdownToTiptap } from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';
import { calculateStartPosition } from './utils/position-calculator';
import { renderFullCanvasdown } from './renderers/full-renderer';
import { isPatchDSL, checkPatchDslDoubleQuotes } from './renderers/patch-renderer';

/** data 상위 예약 필드만 유지, 나머지(color/shape 등)는 data.properties로 */
const DATA_TOP_LEVEL_KEYS = new Set([
  'blockMountId',
  'blockId',
  'blockType',
  'title',
  'viewMode',
  'sizes',
  'size',
  'content',
  'customProperties',
  'parentBlockMountId',
  'isCollisionTarget',
  'createdAt',
  'updatedAt',
  'createdByProfile',
]);

/** @update 적용 시 노드 변환: content → TipTap JSON, title 제외한 나머지 → data.properties */
type TransformUpdateNode = (
  node: Node,
  operation: { type: string; properties?: Record<string, unknown>; customProperties?: Array<{ key: string; value: unknown }> }
) => Node;


interface UseCanvasdownExecutorProps {
  pageId: string;
  core: CanvasdownCore;
  onComplete?: () => void;
}

interface ExecuteRenderParams {
  canvasdown: string;
  sourceBlockPosition?: { x: number; y: number };
  sourceBlockSize?: { width: number; height: number };
  sourceBlockId?: string;
  /** When set, place relative to this block (blockMountId). Use with anchorDirection. */
  anchorBlockId?: string;
  anchorDirection?: 'right' | 'below';
}

interface UseCanvasdownExecutorReturn {
  isRendering: boolean;
  executeRender: (params: ExecuteRenderParams) => Promise<{
    success: boolean;
    blockIdMap: Map<string, string>;
    errors: string[];
  }>;
  blockIdMap: Map<string, string>; // canvasdown ID → blockMountId 매핑
}

/**
 * Canvasdown Executor Hook
 *
 * Canvasdown DSL 텍스트를 받아서 parseCanvasdown으로 파싱하고 렌더링합니다.
 */
export function useCanvasdownExecutor(
  props: UseCanvasdownExecutorProps
): UseCanvasdownExecutorReturn {
  const { pageId, core, onComplete } = props;

  const { getNodes, getNode, setNodes } = useReactFlow();
  const blockLifecycle = useCanvasBlockLifecycle({ pageId });
  const edgeLifecycle = useCanvasEdgeLifecycle({ pageId });

  const updateNode = useCallback(
    (nodeId: string, options: { data: Partial<BlockNodeData> }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...options.data } } : n
        )
      );
    },
    [setNodes]
  );
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: { getNode, updateNode },
  });
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: { getNode, updateNode },
  });
  const { updateProperties } = useUpdateBlockProperty({
    reactFlow: { getNode, updateNode },
  });

  const transformUpdateNode = useCallback<TransformUpdateNode>((node, operation) => {
    if (operation.type !== 'update' || !operation.properties) {
      return node;
    }
    const props = operation.properties as Record<string, unknown>;
    const { title, content, ...restFromPatch } = props;
    const currentData = (node.data ?? {}) as Record<string, unknown>;
    const currentProperties = (currentData.properties ?? {}) as Record<string, unknown>;

    // 기존 data에서 예약 필드만 상위에 유지, 나머지(color/shape 등)는 properties로
    const topLevelOnly: Record<string, unknown> = {};
    let intoProperties: Record<string, unknown> = { ...currentProperties };
    for (const [key, value] of Object.entries(currentData)) {
      if (key === 'properties') continue;
      if (DATA_TOP_LEVEL_KEYS.has(key)) {
        topLevelOnly[key] = value;
      } else {
        intoProperties[key] = value;
      }
    }
    intoProperties = { ...intoProperties, ...restFromPatch };

    const nextData: Record<string, unknown> = {
      ...topLevelOnly,
      properties: intoProperties,
    };
    if (title != null && typeof title === 'string') {
      nextData.title = title;
    }
    if (content != null && typeof content === 'string') {
      const unescaped = content.replace(/\\n/g, '\n');
      nextData.content = markdownToTiptap(unescaped);
    }
    if (operation.customProperties?.length) {
      const currentCustom = (currentData.customProperties ?? []) as Array<{ key: string; value: unknown }>;
      const byKey = new Map(currentCustom.map((p: { key: string; value: unknown }) => [p.key, p]));
      for (const cp of operation.customProperties) {
        byKey.set(cp.key, cp);
      }
      nextData.customProperties = Array.from(byKey.values());
    }
    return { ...node, data: nextData } as Node;
  }, []);

  const [isRendering, setIsRendering] = useState(false);
  const nodeIdMapRef = useRef<Map<string, string>>(new Map()); // canvasdown ID -> blockMountId 매핑

  const onPatchApplied = useCallback(
    (result: PatchAppliedResult) => {
      const updates = result.operations.filter(
        (op: UpdateOperation | { type: string }): op is UpdateOperation => op.type === 'update'
      );

      for (const u of updates) {
        // nodeIdMap: canvasdown ID → blockMountId. Patch may use either;
        // when targetId is blockMountId (e.g. UUID), lookup fails → use targetId as blockMountId.
        const blockMountId = nodeIdMapRef.current.get(u.targetId) ?? u.targetId;

        const node = getNode(blockMountId);
        const blockData = node?.data as BlockNodeData | undefined;
        if (!node || !blockData?.blockId) continue;

        const props = u.properties ?? {};
        const contentRaw = props.content;
        const title = props.title;
        const { content: _c, title: _t, ...restProperties } = props as Record<string, unknown>;

        if (contentRaw != null && typeof contentRaw === 'string') {
          // 리터럴 \n(백슬래시+n) → 실제 줄바꿈. AI/프롬프트 "use \"\\n\" for new lines" 로 인해 들어옴.
          const unescaped = contentRaw.replace(/\\n/g, '\n');
          void updateBlockContent({
            nodeId: blockMountId,
            content: markdownToTiptap(unescaped),
            blockData,
            contentRaw: unescaped,
          }).catch(() => {});
        }
        if (title != null && typeof title === 'string') {
          void updateBlockTitle({
            nodeId: blockMountId,
            title,
            blockData,
          }).catch(() => {});
        }
        if (Object.keys(restProperties).length > 0) {
          void updateProperties(blockData.blockId, restProperties, blockData).catch(() => {});
        }
      }
    },
    [getNode, updateBlockContent, updateBlockTitle, updateProperties]
  );

  const patchOptions = {
    preservePositions: true,
    transformUpdateNode,
    onPatchApplied,
  } as Parameters<typeof useCanvasdownPatch>[1];
  const { applyPatch } = useCanvasdownPatch(core, patchOptions);

  const executeRender = useCallback(
    async (params: ExecuteRenderParams) => {
      const {
        canvasdown,
        sourceBlockPosition,
        sourceBlockSize,
        sourceBlockId,
        anchorBlockId,
        anchorDirection,
      } = params;

      if (!canvasdown || !canvasdown.trim()) {
        return {
          success: false,
          blockIdMap: new Map(),
          errors: ['No canvasdown code provided'],
        };
      }

      // Patch DSL 체크
      const isPatch = isPatchDSL(canvasdown);

      if (isPatch) {
        // content/title 더블쿼트 검사 (파서 에러 방지)
        const quoteCheck = checkPatchDslDoubleQuotes(canvasdown);
        if (!quoteCheck.ok) {
          return {
            success: false,
            blockIdMap: nodeIdMapRef.current,
            errors: quoteCheck.violations,
          };
        }
        // Patch DSL: canvasdown-reactflow의 useCanvasdownPatch + applyPatch 사용
        // 서버 저장은 onPatchApplied 콜백에서 처리
        setIsRendering(true);
        try {
          applyPatch(canvasdown);
          return {
            success: true,
            blockIdMap: nodeIdMapRef.current,
            errors: [],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            blockIdMap: nodeIdMapRef.current,
            errors: [errorMessage],
          };
        } finally {
          setIsRendering(false);
          onComplete?.();
        }
      }

      // Full DSL 처리: parseCanvasdown으로 동기적으로 파싱
      setIsRendering(true);

      // Full DSL의 경우 ID 매핑 초기화
      nodeIdMapRef.current.clear();

      try {
        // parseCanvasdown으로 동기적으로 파싱
        const parseResult = parseCanvasdown(canvasdown, { core });

        if (parseResult.error) {
          return {
            success: false,
            blockIdMap: new Map(),
            errors: [parseResult.error],
          };
        }

        const { nodes, edges } = parseResult;

        if (nodes.length === 0) {
          return {
            success: true,
            blockIdMap: new Map(),
            errors: [],
          };
        }

        // 시작 위치 계산
        const existingNodes = getNodes();
        let startPosition: { x: number; y: number };

        if (anchorBlockId && anchorDirection) {
          const anchorNode = existingNodes.find((n) => n.id === anchorBlockId);
          if (!anchorNode) {
            return {
              success: false,
              blockIdMap: new Map(),
              errors: [`Anchor block not found: ${anchorBlockId}`],
            };
          }
          const anchorPosition = anchorNode.position;
          const anchorWidth = (anchorNode.width as number) ?? 300;
          const anchorHeight = (anchorNode.height as number) ?? 200;
          startPosition = calculateStartPosition({
            sourceBlockPosition: anchorPosition,
            sourceBlockSize: { width: anchorWidth, height: anchorHeight },
            existingNodes,
            sourceBlockId: anchorBlockId,
            forceDirection: anchorDirection,
          });
        } else if (sourceBlockPosition && sourceBlockSize) {
          startPosition = calculateStartPosition({
            sourceBlockPosition,
            sourceBlockSize,
            existingNodes,
            sourceBlockId,
          });
        } else {
          return {
            success: false,
            blockIdMap: new Map(),
            errors: ['Either (sourceBlockPosition, sourceBlockSize) or (anchorBlockId, anchorDirection) must be provided'],
          };
        }

        // Full Renderer로 렌더링
        const result = await renderFullCanvasdown({
          nodes,
          edges,
          startPosition,
          blockLifecycle,
          edgeLifecycle,
          nodeIdMap: nodeIdMapRef.current,
        });

        if (!result.success && result.errors.length > 0) {
          console.error('[useCanvasdownExecutor] Rendering errors:', result.errors);
        }

        return {
          success: result.success,
          blockIdMap: nodeIdMapRef.current,
          errors: result.errors.map(e => e instanceof Error ? e.message : String(e)),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[useCanvasdownExecutor] Error rendering Canvasdown:', error);
        return {
          success: false,
          blockIdMap: new Map(),
          errors: [errorMessage],
        };
      } finally {
        setIsRendering(false);
        onComplete?.();
      }
    },
    [core, getNodes, blockLifecycle, edgeLifecycle, applyPatch, onComplete]
  );

  return {
    isRendering,
    executeRender,
    blockIdMap: nodeIdMapRef.current,
  };
}
