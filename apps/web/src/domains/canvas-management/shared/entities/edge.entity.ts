import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import type { MarkerType } from '../types/marker-type';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../value-objects/edge-handle.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { EdgeStyle } from '../value-objects/edge-style.vo';

/**
 * Edge Entity
 * Canvas에서 블럭 마운트(block mount) 간의 연결 관계를 표현
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 *    - Rationale: Edges represent visual connections between block instances on a specific page
 *    - Performance: Eliminates JOINs on page render (most frequent operation)
 *    - Logic: Page-specific connections, not global block relationships
 *
 * Invariants:
 * - self-loop 허용 (DB 스키마 설계에 따름)
 * - edgeShape은 유효한 React Flow 엣지 모양이어야 함
 * - source/target은 block mount ID를 참조함 (React Flow 노드 ID와 동일)
 * - sourceHandle/targetHandle은 항상 존재해야 함 (EdgeHandle Value Object)
 */
export class Edge {
  constructor(
    public readonly id: EdgeId,
    public readonly pageId: PageId,
    public readonly sourceBlockMountId: BlockMountId,
    public readonly targetBlockMountId: BlockMountId,
    public readonly sourceHandle: EdgeHandle,
    public readonly targetHandle: EdgeHandle,
    public edgeShape: EdgeShape = EdgeShape.default(),
    public edgeLabel: string = '',
    public edgeStyle: EdgeStyle = EdgeStyle.default(),
    public markerEnd: MarkerType = 'arrow',
    public markerStart: MarkerType | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  /**
   * 기존 데이터로 Edge 재구성 (Repository에서 사용)
   *
   * @param params - Edge 재구성에 필요한 모든 파라미터
   * @returns Edge 인스턴스
   */
  static reconstitute(params: {
    id: EdgeId;
    pageId: PageId;
    sourceBlockMountId: BlockMountId;
    targetBlockMountId: BlockMountId;
    sourceHandle: EdgeHandle;
    targetHandle: EdgeHandle;
    edgeShape: EdgeShape;
    edgeLabel: string;
    edgeStyle: EdgeStyle;
    markerEnd: MarkerType;
    markerStart: MarkerType | null;
    createdAt: Date;
    updatedAt: Date;
  }): Edge {
    return new Edge(
      params.id,
      params.pageId,
      params.sourceBlockMountId,
      params.targetBlockMountId,
      params.sourceHandle,
      params.targetHandle,
      params.edgeShape,
      params.edgeLabel,
      params.edgeStyle,
      params.markerEnd,
      params.markerStart,
      params.createdAt,
      params.updatedAt
    );
  }

  /**
   * 엣지 모양 변경
   */
  updateShape(newShape: EdgeShape): void {
    this.edgeShape = newShape;
    this.updatedAt = new Date();
  }

  /**
   * 엣지 레이블 변경
   */
  updateLabel(newLabel: string): void {
    this.edgeLabel = newLabel;
    this.updatedAt = new Date();
  }

  /**
   * 엣지 스타일 변경
   */
  updateStyle(style: { stroke?: string; strokeWidth?: number }): void {
    let newStyle = this.edgeStyle;

    if (style.stroke !== undefined) {
      newStyle = newStyle.withColor(style.stroke);
    }
    if (style.strokeWidth !== undefined) {
      newStyle = newStyle.withThickness(style.strokeWidth);
    }

    this.edgeStyle = newStyle;
    this.updatedAt = new Date();
  }

  /**
   * 엣지 끝(타겟) 화살표 변경
   */
  changeMarkerEnd(markerEnd: MarkerType): void {
    this.markerEnd = markerEnd;
    this.updatedAt = new Date();
  }

  /**
   * 엣지 시작(소스) 화살표 변경
   */
  changeMarkerStart(markerStart: MarkerType | null): void {
    this.markerStart = markerStart;
    this.updatedAt = new Date();
  }

  /**
   * React Flow 스타일 가져오기 (stroke, strokeWidth)
   */
  get style(): { stroke: string; strokeWidth: number } {
    return this.edgeStyle.toReactFlowStyle();
  }

  /**
   * 엣지가 특정 블럭 마운트와 연결되어 있는지 확인
   */
  isConnectedTo(blockMountId: BlockMountId): boolean {
    return (
      this.sourceBlockMountId.equals(blockMountId) ||
      this.targetBlockMountId.equals(blockMountId)
    );
  }

  /**
   * self-loop 여부 확인 (같은 블럭 마운트를 소스와 타겟으로 가지는 경우)
   */
  isSelfLoop(): boolean {
    return this.sourceBlockMountId.equals(this.targetBlockMountId);
  }
}
