import { Edge } from '../entities/edge.entity';
import { EdgeId } from '../value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { DomainEvent } from '../events';

/**
 * Edge Aggregate
 * Edge Entity의 생명주기와 비즈니스 규칙을 관리
 */
export class EdgeAggregate {
  private _events: DomainEvent[] = [];

  constructor(public readonly edge: Edge) {}

  /**
   * 새로운 엣지 생성
   */
  static createEdge(
    edgeId: EdgeId,
    pageId: PageId,
    sourceBlockId: BlockId,
    targetBlockId: BlockId,
    edgeType: string = 'default'
  ): EdgeAggregate {
    // 1. 자기 참조 방지 검증
    if (sourceBlockId.equals(targetBlockId)) {
      throw new Error('Edge cannot connect a block to itself');
    }

    // 2. Edge Entity 생성
    const edge = new Edge(
      edgeId,
      pageId,
      sourceBlockId,
      targetBlockId,
      edgeType
    );

    // 3. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // TODO: EdgeCreated 이벤트 생성 및 추가
    // const event = new EdgeCreatedEvent(edgeId, {...});
    // aggregate._events.push(event);

    return aggregate;
  }

  /**
   * 엣지 타입 업데이트
   */
  updateEdgeType(newType: string): void {
    this.edge.updateType(newType);

    // TODO: EdgeTypeUpdated 이벤트 추가
  }

  /**
   * 엣지 레이블 업데이트
   */
  updateEdgeLabel(newLabel: string): void {
    this.edge.updateLabel(newLabel);

    // TODO: EdgeLabelUpdated 이벤트 추가
  }

  /**
   * 엣지 스타일 업데이트
   */
  updateEdgeStyle(color?: string, thickness?: number): void {
    this.edge.updateStyle(color, thickness);

    // TODO: EdgeStyleUpdated 이벤트 추가
  }

  /**
   * 도메인 이벤트 조회
   */
  getEvents(): ReadonlyArray<DomainEvent> {
    return this._events;
  }

  /**
   * 도메인 이벤트 초기화
   */
  clearEvents(): void {
    this._events = [];
  }
}
