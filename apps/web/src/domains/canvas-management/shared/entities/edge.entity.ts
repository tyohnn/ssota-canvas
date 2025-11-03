import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';

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
 * - sourceHandle/targetHandle은 React Flow handle ID ('left', 'right', 'top', 'bottom')
 */
export class Edge {
  constructor(
    public readonly id: EdgeId,
    public readonly pageId: PageId,
    public readonly sourceBlockMountId: BlockMountId,
    public readonly targetBlockMountId: BlockMountId,
    public readonly sourceHandle?: string, // React Flow handle ID ('left', 'right', 'top', 'bottom')
    public readonly targetHandle?: string, // React Flow handle ID ('left', 'right', 'top', 'bottom')
    public edgeShape: EdgeShape = EdgeShape.default(),
    public edgeLabel: string = '',
    public edgeStyle: {
      color: string;
      thickness: number;
    } = {
      color: '#000000',
      thickness: 2,
    },
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

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
    if (style.stroke !== undefined) {
      this.edgeStyle.color = style.stroke;
    }
    if (style.strokeWidth !== undefined) {
      this.edgeStyle.thickness = style.strokeWidth;
    }
    this.updatedAt = new Date();
  }

  /**
   * React Flow 스타일 가져오기 (stroke, strokeWidth)
   */
  get style(): { stroke: string; strokeWidth: number } {
    return {
      stroke: this.edgeStyle.color,
      strokeWidth: this.edgeStyle.thickness,
    };
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
