import { Edge } from '../entities/edge.entity';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import {
  DomainEvent,
  EdgeCreatedEvent,
  EdgeShapeChangedEvent,
  EdgeLabelChangedEvent,
  EdgeStyleChangedEvent,
  EdgeDeletedEvent,
} from '../events';

/**
 * Edge Aggregate
 * Edge Entity의 생명주기와 비즈니스 규칙을 관리
 *
 * Invariants:
 * - self-loop 허용 (DB 스키마 설계에 따름)
 * - 엣지는 특정 페이지에서만 존재함
 * - 블럭 삭제 시 연결된 모든 엣지 자동 삭제 (Service Layer에서 처리)
 */
export class EdgeAggregate {
  private _events: DomainEvent[] = [];

  constructor(public readonly edge: Edge) {}

  /**
   * 새로운 엣지 생성
   * self-loop 허용
   */
  static createEdge(
    edgeId: EdgeId,
    pageId: PageId,
    sourceBlockId: BlockId,
    targetBlockId: BlockId,
    edgeShape?: EdgeShape
  ): EdgeAggregate {
    // 1. Edge Entity 생성 (self-loop 허용)
    const edge = new Edge(
      edgeId,
      pageId,
      sourceBlockId,
      targetBlockId,
      edgeShape || EdgeShape.default()
    );

    // 2. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // 3. EdgeCreated 이벤트 생성 및 추가
    const event = new EdgeCreatedEvent(edgeId, {
      edgeId,
      pageId,
      sourceBlockId,
      targetBlockId,
      edgeShape: edge.edgeShape,
      occurredAt: new Date(),
    });
    aggregate._events.push(event);

    return aggregate;
  }

  /**
   * 엣지 모양 업데이트
   */
  updateEdgeShape(newShape: EdgeShape): void {
    this.edge.updateShape(newShape);

    // EdgeShapeChanged 이벤트 추가
    const event = new EdgeShapeChangedEvent(this.edge.id, {
      edgeId: this.edge.id,
      newShape,
      occurredAt: new Date(),
    });
    this._events.push(event);
  }

  /**
   * 엣지 레이블 업데이트
   */
  updateEdgeLabel(newLabel: string): void {
    this.edge.updateLabel(newLabel);

    // EdgeLabelChanged 이벤트 추가
    const event = new EdgeLabelChangedEvent(this.edge.id, {
      edgeId: this.edge.id,
      newLabel,
      occurredAt: new Date(),
    });
    this._events.push(event);
  }

  /**
   * 엣지 스타일 업데이트
   */
  updateEdgeStyle(style: { stroke?: string; strokeWidth?: number }): void {
    this.edge.updateStyle(style);

    // EdgeStyleChanged 이벤트 추가
    const event = new EdgeStyleChangedEvent(this.edge.id, {
      edgeId: this.edge.id,
      style,
      occurredAt: new Date(),
    });
    this._events.push(event);
  }

  /**
   * 엣지 삭제
   */
  deleteEdge(): void {
    // EdgeDeleted 이벤트 추가
    const event = new EdgeDeletedEvent(this.edge.id, {
      edgeId: this.edge.id,
      occurredAt: new Date(),
    });
    this._events.push(event);
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
