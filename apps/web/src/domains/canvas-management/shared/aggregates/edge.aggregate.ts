import type {
  CreateEdgeCommand,
  DeleteEdgeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeStyleCommand,
} from '../commands';
import { Edge } from '../entities/edge.entity';
import {
  EdgeCreatedEvent,
  EdgeDeletedEvent,
  EdgeLabelChangedEvent,
  EdgeShapeChangedEvent,
  EdgeStyleChangedEvent,
} from '../events';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';

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
   * 새로운 엣지 생성 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Domain Event를 발생 (1 Command : 1 Event)
   * - self-loop 허용
   *
   * @param command - CreateEdgeCommand (비즈니스 의도)
   * @returns EdgeAggregate
   */
  static createEdge(command: CreateEdgeCommand): EdgeAggregate {
    // 1. EdgeId 생성
    const edgeId = EdgeId.generate();

    // 2. Edge Entity 생성 (self-loop 허용)
    const edge = new Edge(
      edgeId,
      command.pageId,
      command.sourceBlockMountId,
      command.targetBlockMountId,
      command.sourceHandle,
      command.targetHandle
    );

    // 3. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // 4. Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeCreatedEvent(
      edgeId,
      {
        edgeId,
        pageId: command.pageId,
        sourceBlockMountId: command.sourceBlockMountId,
        targetBlockMountId: command.targetBlockMountId,
        sourceHandle: command.sourceHandle,
        targetHandle: command.targetHandle,
      },
      edge.createdAt
    );
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * 엣지 모양 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - UpdateEdgeShapeCommand
   */
  updateEdgeShape(command: UpdateEdgeShapeCommand): void {
    this.edge.updateShape(command.newShape);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeShapeChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        newShape: command.newShape,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 레이블 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - UpdateEdgeLabelCommand
   */
  updateEdgeLabel(command: UpdateEdgeLabelCommand): void {
    this.edge.updateLabel(command.newLabel);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeLabelChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        newLabel: command.newLabel,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 스타일 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - UpdateEdgeStyleCommand
   */
  updateEdgeStyle(command: UpdateEdgeStyleCommand): void {
    this.edge.updateStyle(command.style);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeStyleChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        style: command.style,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 삭제 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - DeleteEdgeCommand
   */
  deleteEdge(command: DeleteEdgeCommand): void {
    // Domain Event 발생 (Command → Event 1:1 대응)
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
