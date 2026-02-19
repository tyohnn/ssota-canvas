/**
 * Node Creation Service
 * 
 * Canvasdown 노드를 SSOTA 블록으로 생성하는 서비스
 * 부모/자식 노드 생성 공통 로직을 통합합니다.
 */

import type { Node } from '@xyflow/react';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { markdownToTiptap } from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import type { UseCanvasBlockLifecycleResult } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { Position } from '../utils/position-adjuster';
import { normalizeNewlinesInString } from '../utils/normalize-newlines';

export interface CreateNodeParams {
  canvasdownNode: Node;
  adjustedPosition: Position;
  blockLifecycle: UseCanvasBlockLifecycleResult;
  nodeIdMap: Map<string, string>;
}

export interface CreateNodeResult {
  blockMountId: string | null;
  success: boolean;
}

/**
 * Canvasdown 노드 타입을 SSOTA BlockType으로 매핑
 */
function mapCanvasdownTypeToBlockType(
  canvasdownType: string
): BlockType | null {
  switch (canvasdownType) {
    case 'shape':
      return BlockType.SHAPE;
    case 'markdown':
      return BlockType.MARKDOWN;
    case 'group':
    case 'zone':  // @zone은 group 블록으로 매핑
      return BlockType.GROUP;
    default:
      return null;
  }
}

/**
 * 노드 데이터에서 title 추출 (Canvasdown 파서 출력: title 또는 label)
 *
 * - @ssota-labs/canvasdown-reactflow 어댑터는 title이 없을 때 node.id로 채우므로,
 *   title이 노드 id와 같으면(실제 제목이 아닌 id 폴백) @shape id "..." 의 따옴표 문자열(label)을 우선 사용한다.
 * - zone/group: 레지스트리 defaultProperties.title('New Zone')이 파싱된 제목을 덮어쓸 수 있으므로,
 *   title이 'New Zone'이고 label이 있으면 label(LLM 출력)을 우선 사용한다.
 */
function extractTitle(canvasdownNode: Node): string {
  const raw = canvasdownNode.data as Record<string, unknown> | undefined;
  if (raw && typeof raw === 'object') {
    const title = typeof raw.title === 'string' ? raw.title : undefined;
    const label = typeof raw.label === 'string' ? raw.label : undefined;
    if (label && title === canvasdownNode.id) return label;
    if (
      (canvasdownNode.type === 'zone' || canvasdownNode.type === 'group') &&
      title === 'New Zone' &&
      label
    )
      return label;
    if (title) return title;
    if (label) return label;
  }
  return 'Untitled';
}

/**
 * 노드 데이터에서 properties 추출.
 * Parser는 color, shapeType, borderStyle(shape/markdown), direction, padding(zone) 등을
 * node.data에 직접 넣으므로, data.properties가 없어도 data의 최상위 필드를 properties로 사용한다.
 */
function extractProperties(canvasdownNode: Node): Record<string, unknown> {
  const raw = canvasdownNode.data as Record<string, unknown> | undefined;
  const fromProperties =
    (raw && typeof raw === 'object' && raw.properties != null && typeof raw.properties === 'object'
      ? (raw.properties as Record<string, unknown>)
      : {}) as Record<string, unknown>;
  const fromData: Record<string, unknown> = {};
  if (raw && typeof raw === 'object') {
    if (raw.color !== undefined) fromData.color = raw.color;
    if (raw.shapeType !== undefined) fromData.shapeType = raw.shapeType;
    if (raw.borderStyle !== undefined) fromData.borderStyle = raw.borderStyle;
    if (raw.direction !== undefined) fromData.direction = raw.direction;
    if (raw.padding !== undefined) fromData.padding = raw.padding;
  }
  return { ...fromData, ...fromProperties };
}

/**
 * 노드 데이터에서 content 추출 (Canvasdown 파서 출력)
 */
function extractContent(canvasdownNode: Node): unknown | undefined {
  const raw = canvasdownNode.data as Record<string, unknown> | undefined;
  return raw?.content;
}

/**
 * Canvasdown 노드를 SSOTA 블록으로 생성합니다.
 * 
 * @param params - 노드 생성 파라미터
 * @returns 생성 결과
 */
export async function createNodeFromCanvasdown(
  params: CreateNodeParams
): Promise<CreateNodeResult> {
  const { canvasdownNode, adjustedPosition, blockLifecycle, nodeIdMap } = params;

  // 기존 블록 ID 매핑 확인 (Patch DSL의 @update 명령 처리용)
  const existingBlockMountId = nodeIdMap.get(canvasdownNode.id);
  if (existingBlockMountId) {
    // TODO: blockLifecycle.updateBlock 구현 필요
    // 현재는 블록 업데이트 API가 없으므로 경고만 출력
    console.warn(
      `[NodeCreationService] Block update not yet implemented for ID: ${canvasdownNode.id}`
    );
    return {
      blockMountId: existingBlockMountId,
      success: true,
    };
  }

  // Canvasdown 노드 타입을 SSOTA BlockType으로 매핑
  const blockType = mapCanvasdownTypeToBlockType(canvasdownNode.type || '');
  if (!blockType) {
    console.warn(
      `[NodeCreationService] Unknown block type: ${canvasdownNode.type}`
    );
    return {
      blockMountId: null,
      success: false,
    };
  }

  // 노드 데이터 추출
  let title = extractTitle(canvasdownNode);
  const properties = extractProperties(canvasdownNode);
  let content = extractContent(canvasdownNode);

  // 문자열 title/content: \\n → 줄바꿈, 줄 끝 \ 제거 (한 군데에서만 처리)
  if (typeof title === 'string' && title.length > 0) {
    title = normalizeNewlinesInString(title);
  }
  if (typeof content === 'string' && content.length > 0) {
    content = normalizeNewlinesInString(content as string);
  }

  // 파서가 node.data.content를 채우지 않을 때: 마크다운 블록은 title을 초기 content로 사용
  if (content === undefined && blockType === BlockType.MARKDOWN && title) {
    content = markdownToTiptap(title);
  }
  // blocks.content는 블록 종류에 상관없이 항상 TipTap JSON. 파서가 문자열로 주면 변환
  if (typeof content === 'string') {
    content = markdownToTiptap(content);
  }

  // GROUP(zone): GroupBlock이 properties.title을 우선 표시하므로 initialProperties에 title 포함
  const initialProperties =
    blockType === BlockType.GROUP
      ? { ...properties, title } as Record<string, unknown>
      : properties;

  try {
    // SSOTA 블록 생성
    const result = await blockLifecycle.createAndMountBlock(
      blockType,
      adjustedPosition,
      initialProperties,
      content,
      title
    );

    if (result) {
      // ID 매핑 저장 (엣지 생성 및 Patch DSL에서 사용)
      nodeIdMap.set(canvasdownNode.id, result.blockMountId);
      return {
        blockMountId: result.blockMountId,
        success: true,
      };
    }

    return {
      blockMountId: null,
      success: false,
    };
  } catch (error) {
    console.error(
      `[NodeCreationService] Error creating block for node ${canvasdownNode.id}:`,
      error
    );
    return {
      blockMountId: null,
      success: false,
    };
  }
}
