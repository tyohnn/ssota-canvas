import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeAggregate } from '../edge.aggregate';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { EdgeShape } from '../../value-objects/edge-shape.vo';
import { EdgeHandle } from '../../value-objects/edge-handle.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import {
  CreateEdgeCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeStyleCommand,
  DeleteEdgeCommand,
} from '../../commands';
import {
  EdgeCreatedEvent,
  EdgeLabelChangedEvent,
  EdgeStyleChangedEvent,
  EdgeDeletedEvent,
  EdgeShapeChangedEvent,
} from '../../events';

describe('EdgeAggregate', () => {
  let edgeId: EdgeId;
  let pageId: PageId;
  let sourceBlockMountId: BlockMountId;
  let targetBlockMountId: BlockMountId;

  beforeEach(() => {
    edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    sourceBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440002');
    targetBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440003');
  });

  describe('createEdge', () => {
    it('유효한 파라미터로 새로운 Edge를 생성할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const command: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      // When
      const aggregate = EdgeAggregate.createEdge(command);

      // Then
      expect(aggregate.edge.id).toBeDefined();
      expect(aggregate.edge.pageId).toBe(pageId);
      expect(aggregate.edge.sourceBlockMountId).toBe(sourceBlockMountId);
      expect(aggregate.edge.targetBlockMountId).toBe(targetBlockMountId);
      expect(aggregate.edge.sourceHandle.equals(sourceHandle)).toBe(true);
      expect(aggregate.edge.targetHandle.equals(targetHandle)).toBe(true);
    });

    it('기본 edgeType으로 Edge를 생성할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const command: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      // When
      const aggregate = EdgeAggregate.createEdge(command);

      // Then
      expect(aggregate.edge.edgeShape.isDefault()).toBe(true);
    });

    it('EdgeCreated 이벤트를 발행해야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const command: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      // When
      const aggregate = EdgeAggregate.createEdge(command);

      // Then
      // Note: EdgeAggregate doesn't expose getEvents() method
      // Events are handled internally and committed through repository
      expect(aggregate.edge.id).toBeDefined();
      const events = aggregate.getUncommittedEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeCreatedEvent);
    });

    it('self-loop를 허용해야 한다 (같은 블럭 간 연결)', () => {
      // Given
      const sameBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440002');
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const command: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId: sameBlockMountId,
        targetBlockMountId: sameBlockMountId,
        sourceHandle,
        targetHandle,
      };

      // When
      const aggregate = EdgeAggregate.createEdge(command);

      // Then
      expect(aggregate.edge.sourceBlockMountId.equals(sameBlockMountId)).toBe(true);
      expect(aggregate.edge.targetBlockMountId.equals(sameBlockMountId)).toBe(true);
      expect(aggregate.edge.isSelfLoop()).toBe(true);
    });
  });

  describe('updateEdgeShape', () => {
    it('엣지 모양을 업데이트할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted(); // 생성 이벤트 클리어
      const newShape = EdgeShape.step();
      const updateCommand: UpdateEdgeShapeCommand = {
        edgeId: aggregate.edge.id,
        newShape,
      };

      // When
      aggregate.updateEdgeShape(updateCommand);

      // Then
      expect(aggregate.edge.edgeShape.equals(newShape)).toBe(true);
    });

    it('EdgeShapeChanged 이벤트를 발행해야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted(); // 생성 이벤트 클리어
      const newShape = EdgeShape.straight();
      const updateCommand: UpdateEdgeShapeCommand = {
        edgeId: aggregate.edge.id,
        newShape,
      };

      // When
      aggregate.updateEdgeShape(updateCommand);

      // Then
      expect(aggregate.edge.edgeShape.equals(newShape)).toBe(true);
      const events = aggregate.getUncommittedEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeShapeChangedEvent);
    });
  });

  describe('updateEdgeLabel', () => {
    it('엣지 레이블을 업데이트할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted(); // 생성 이벤트 클리어
      const newLabel = 'updated label';
      const updateCommand: UpdateEdgeLabelCommand = {
        edgeId: aggregate.edge.id,
        newLabel,
      };

      // When
      aggregate.updateEdgeLabel(updateCommand);

      // Then
      expect(aggregate.edge.edgeLabel).toBe(newLabel);
    });

    it('EdgeLabelChanged 이벤트를 발행해야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted();
      const newLabel = 'new label';
      const updateCommand: UpdateEdgeLabelCommand = {
        edgeId: aggregate.edge.id,
        newLabel,
      };

      // When
      aggregate.updateEdgeLabel(updateCommand);

      // Then
      expect(aggregate.edge.edgeLabel).toBe(newLabel);
      const events = aggregate.getUncommittedEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeLabelChangedEvent);
    });
  });

  describe('updateEdgeStyle', () => {
    it('엣지 스타일을 업데이트할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted(); // 생성 이벤트 클리어
      const newStyle = { stroke: '#FF0000', strokeWidth: 5 };
      const updateCommand: UpdateEdgeStyleCommand = {
        edgeId: aggregate.edge.id,
        style: newStyle,
      };

      // When
      aggregate.updateEdgeStyle(updateCommand);

      // Then
      expect(aggregate.edge.style.stroke).toBe(newStyle.stroke);
      expect(aggregate.edge.style.strokeWidth).toBe(newStyle.strokeWidth);
    });

    it('EdgeStyleChanged 이벤트를 발행해야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted();
      const newStyle = { stroke: '#00FF00', strokeWidth: 3 };
      const updateCommand: UpdateEdgeStyleCommand = {
        edgeId: aggregate.edge.id,
        style: newStyle,
      };

      // When
      aggregate.updateEdgeStyle(updateCommand);

      // Then
      expect(aggregate.edge.style.stroke).toBe(newStyle.stroke);
      const events = aggregate.getUncommittedEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeStyleChangedEvent);
    });
  });

  describe('deleteEdge', () => {
    it('EdgeDeleted 이벤트를 발행해야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      aggregate.markEventsAsCommitted();
      const deleteCommand: DeleteEdgeCommand = {
        edgeId: aggregate.edge.id,
      };

      // When
      aggregate.deleteEdge(deleteCommand);

      // Then
      const events = aggregate.getUncommittedEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeDeletedEvent);
    });
  });

  describe('getUncommittedEvents', () => {
    it('도메인 이벤트를 조회할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(EdgeCreatedEvent);
    });
  });

  describe('markEventsAsCommitted', () => {
    it('도메인 이벤트를 초기화할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const createCommand: CreateEdgeCommand = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };
      const aggregate = EdgeAggregate.createEdge(createCommand);
      expect(aggregate.getUncommittedEvents().length).toBe(1);

      // When
      aggregate.markEventsAsCommitted();

      // Then
      expect(aggregate.getUncommittedEvents().length).toBe(0);
    });
  });
});
