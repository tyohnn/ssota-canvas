import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeType } from '../value-objects/edge-type.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

/**
 * Edge Entity
 * Canvas에서 블럭 간의 연결 관계를 표현
 *
 * Invariants:
 * - self-loop 허용 (DB 스키마 설계에 따름)
 * - edgeType은 유효한 React Flow 엣지 타입이어야 함
 */
export class Edge {
  constructor(
    public readonly id: EdgeId,
    public readonly pageId: PageId,
    public readonly sourceBlockId: BlockId,
    public readonly targetBlockId: BlockId,
    public edgeType: EdgeType = EdgeType.default(),
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
   * 엣지 타입 변경
   */
  updateType(newType: EdgeType): void {
    this.edgeType = newType;
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
   * 엣지가 특정 블럭과 연결되어 있는지 확인
   */
  isConnectedTo(blockId: BlockId): boolean {
    return (
      this.sourceBlockId.equals(blockId) || this.targetBlockId.equals(blockId)
    );
  }

  /**
   * self-loop 여부 확인 (같은 블럭을 소스와 타겟으로 가지는 경우)
   */
  isSelfLoop(): boolean {
    return this.sourceBlockId.equals(this.targetBlockId);
  }
}
