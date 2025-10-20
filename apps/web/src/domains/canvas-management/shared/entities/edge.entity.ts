import { EdgeId } from '../value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

/**
 * Edge Entity
 * Canvas에서 블럭 간의 연결 관계를 표현
 */
export class Edge {
  constructor(
    public readonly id: EdgeId,
    public readonly pageId: PageId,
    public readonly sourceBlockId: BlockId,
    public readonly targetBlockId: BlockId,
    public edgeType: string = 'default',
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
  updateType(newType: string): void {
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
  updateStyle(color?: string, thickness?: number): void {
    if (color !== undefined) {
      this.edgeStyle.color = color;
    }
    if (thickness !== undefined) {
      this.edgeStyle.thickness = thickness;
    }
    this.updatedAt = new Date();
  }

  /**
   * 엣지가 특정 블럭과 연결되어 있는지 확인
   */
  isConnectedTo(blockId: BlockId): boolean {
    return (
      this.sourceBlockId.equals(blockId) || this.targetBlockId.equals(blockId)
    );
  }
}
