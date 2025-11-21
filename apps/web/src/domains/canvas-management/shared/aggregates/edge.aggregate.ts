import { Edge } from '../entities/edge.entity';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
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
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 *
 * Invariants:
 * - self-loop 허용 (DB 스키마 설계에 따름)
 * - 엣지는 특정 페이지에서만 존재함
 * - 블럭 마운트 삭제 시 연결된 모든 엣지 자동 삭제 (DB cascade)
 */

type EdgeManagementEvents =
  | EdgeCreatedEvent
  | EdgeShapeChangedEvent
  | EdgeLabelChangedEvent
  | EdgeStyleChangedEvent
  | EdgeDeletedEvent;

export class EdgeAggregate {
  private _uncommittedEvents: Array<EdgeManagementEvents> = [];

  constructor(public readonly edge: Edge) {}

  /**
   * 새로운 엣지 생성
   * self-loop 허용
   */
  static createEdge(
    edgeId: EdgeId,
    pageId: PageId,
    sourceBlockMountId: BlockMountId,
    targetBlockMountId: BlockMountId,
    edgeShape?: EdgeShape,
    sourceHandle?: string,
    targetHandle?: string
  ): EdgeAggregate {
    // 1. Edge Entity 생성 (self-loop 허용)
    const edge = new Edge(
      edgeId,
      pageId,
      sourceBlockMountId,
      targetBlockMountId,
      sourceHandle,
      targetHandle,
      edgeShape || EdgeShape.default()
    );

    // 2. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // 3. EdgeCreated 이벤트 생성 및 추가
    const event = new EdgeCreatedEvent(
      edgeId,
      {
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
        edgeShape: edge.edgeShape,
      },
      edge.createdAt
    );
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * 엣지 모양 업데이트
   */
  updateEdgeShape(newShape: EdgeShape): void {
    this.edge.updateShape(newShape);

    // EdgeShapeChanged 이벤트 추가
    const event = new EdgeShapeChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        newShape,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 레이블 업데이트
   */
  updateEdgeLabel(newLabel: string): void {
    this.edge.updateLabel(newLabel);

    // EdgeLabelChanged 이벤트 추가
    const event = new EdgeLabelChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        newLabel,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 스타일 업데이트
   */
  updateEdgeStyle(style: { stroke?: string; strokeWidth?: number }): void {
    this.edge.updateStyle(style);

    // EdgeStyleChanged 이벤트 추가
    const event = new EdgeStyleChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        style,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 삭제
   */
  deleteEdge(): void {
    // EdgeDeleted 이벤트 추가
    const event = new EdgeDeletedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
      },
      new Date()
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 커밋되지 않은 이벤트들 반환
   */
  getUncommittedEvents(): Array<EdgeManagementEvents> {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트 커밋 (이벤트 스토어에 저장 후 호출)
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
