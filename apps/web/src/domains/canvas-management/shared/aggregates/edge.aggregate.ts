import type {
  CreateEdgeCommand,
  DeleteEdgeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeMarkerCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeStyleCommand,
} from '../commands';
import { EdgeView } from '../dtos/views/edge.views';
import { Edge } from '../entities/edge.entity';
import {
  EdgeCreatedEvent,
  EdgeDeletedEvent,
  EdgeLabelChangedEvent,
  EdgeMarkersChangedEvent,
  EdgeShapeChangedEvent,
  EdgeStyleChangedEvent,
} from '../events';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { EdgeStyle } from '../value-objects/edge-style.vo';

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
  | EdgeMarkersChangedEvent
  | EdgeDeletedEvent;

export class EdgeAggregate {
  private _uncommittedEvents: Array<EdgeManagementEvents> = [];

  constructor(public readonly edge: Edge) { }

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
    // 1. EdgeId 생성 및 slug (8자 hex, page 내 유일)
    const edgeId = EdgeId.generate();
    const slug = edgeId.value.replace(/-/g, '').slice(0, 8).toLowerCase();

    // 2. 선택 필드: 라벨, 스타일, shape, 마커 (없으면 기본값)
    const defaultStyle = EdgeStyle.default();
    const edgeStyle = command.style
      ? EdgeStyle.fromObject({
        color: command.style.stroke ?? defaultStyle.color,
        thickness: command.style.strokeWidth ?? defaultStyle.thickness,
      })
      : defaultStyle;
    const edgeShape = command.shape
      ? new EdgeShape(command.shape)
      : EdgeShape.default();

    // 3. Edge Entity 생성 (self-loop 허용)
    const edge = new Edge(
      edgeId,
      slug,
      command.pageId,
      command.sourceBlockMountId,
      command.targetBlockMountId,
      command.sourceHandle,
      command.targetHandle,
      edgeShape,
      command.label ?? '',
      edgeStyle,
      command.markerEnd ?? 'arrow',
      command.markerStart ?? null
    );

    // 4. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // 5. Domain Event 발생 (Command → Event 1:1 대응)
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
    const oldShape = this.edge.edgeShape;
    this.edge.updateShape(command.newShape);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeShapeChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        oldShape,
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
    const oldLabel = this.edge.edgeLabel;
    this.edge.updateLabel(command.newLabel);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeLabelChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        oldLabel,
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
    const oldStyle = this.edge.edgeStyle;
    this.edge.updateStyle(command.style);

    // Domain Event 발생 (Command → Event 1:1 대응)
    const event = new EdgeStyleChangedEvent(
      this.edge.id,
      {
        edgeId: this.edge.id,
        oldStyle,
        newStyle: this.edge.edgeStyle,
      },
      this.edge.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 엣지 마커(화살표) 업데이트 (Command Handler) — start/end 중 하나만 변경
   * start = Source(소스), end = Target(타겟). path는 source→target.
   *
   * @param command - UpdateEdgeMarkerCommand
   */
  updateEdgeMarker(command: UpdateEdgeMarkerCommand): void {
    const oldMarkerEnd = this.edge.markerEnd;
    const oldMarkerStart = this.edge.markerStart;

    if (command.marker === 'start') {
      this.edge.changeMarkerStart(
        command.value === 'none' ? null : command.value
      );
      const event = new EdgeMarkersChangedEvent(
        this.edge.id,
        {
          edgeId: this.edge.id,
          markerStart: {
            previous: oldMarkerStart,
            current: this.edge.markerStart,
          },
        },
        this.edge.updatedAt
      );
      this._uncommittedEvents.push(event);
    } else {
      this.edge.changeMarkerEnd(command.value);
      const event = new EdgeMarkersChangedEvent(
        this.edge.id,
        {
          edgeId: this.edge.id,
          markerEnd: { previous: oldMarkerEnd, current: this.edge.markerEnd },
        },
        this.edge.updatedAt
      );
      this._uncommittedEvents.push(event);
    }
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

  /**
   * EdgeAggregate를 EdgeView DTO로 변환
   *
   * Aggregate → DTO 변환 로직을 Aggregate에 캡슐화하여
   * 중복 코드를 제거하고 일관성 있는 변환을 보장합니다.
   *
   * @returns EdgeView DTO
   */
  toView(): EdgeView {
    return {
      edgeId: this.edge.slug,
      pageId: this.edge.pageId.value,
      sourceBlockMountId: this.edge.sourceBlockMountId.value,
      targetBlockMountId: this.edge.targetBlockMountId.value,
      sourceHandle: this.edge.sourceHandle.value,
      targetHandle: this.edge.targetHandle.value,
      edgeShape: this.edge.edgeShape.value,
      label: this.edge.edgeLabel,
      style: this.edge.edgeStyle.toReactFlowStyle(),
      markerEnd: this.edge.markerEnd,
      markerStart: this.edge.markerStart,
      createdAt: this.edge.createdAt.toISOString(),
      updatedAt: this.edge.updatedAt.toISOString(),
    };
  }
}
