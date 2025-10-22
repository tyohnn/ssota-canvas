import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { toReactFlowNodeFromCanvasView, toReactFlowEdgeFromCanvasView } from '../react-flow.acl';
import type { CanvasViewData } from '../../../shared/dtos';

describe('React Flow ACL', () => {
  describe('toReactFlowNodeFromCanvasView', () => {
    it('CanvasViewData의 block을 React Flow Node로 올바르게 변환해야 한다', () => {
      // Given
      const canvasViewData: CanvasViewData = {
        pageId: 'page-123',
        blocks: [
          {
            blockMountId: 'block-mount-123',
            blockId: 'block-456',
            blockType: 'text',
            position: { x: 100, y: 200 },
            size: { width: 150, height: 250 },
            zOrder: 1,
            content: { text: 'Hello World' }
          }
        ],
        edges: [],
        viewport: null
      };

      const block = canvasViewData.blocks[0]!; // 테스트에서 항상 존재함을 보장

      // When
      const reactFlowNode = toReactFlowNodeFromCanvasView(block);

      // Then
      expect(reactFlowNode).toEqual({
        id: 'block-mount-123',
        type: 'text',
        position: { x: 100, y: 200 },
        data: {
          blockMountId: 'block-mount-123',
          blockId: 'block-456',
          blockType: 'text',
          metadata: { text: 'Hello World' },
          size: { width: 150, height: 250 },
          zOrder: 1
        },
        style: {
          width: 150,
          height: 250,
          zIndex: 1
        }
      });
    });

    it('다양한 블록 타입에 대해 올바르게 변환해야 한다', () => {
      // Given
      const block = {
        blockMountId: 'image-mount-789',
        blockId: 'image-999',
        blockType: 'image',
        position: { x: 300, y: 400 },
        size: { width: 300, height: 200 },
        zOrder: 5,
        content: { src: 'https://example.com/image.jpg', alt: 'Test image' }
      };

      // When
      const reactFlowNode = toReactFlowNodeFromCanvasView(block);

      // Then
      expect(reactFlowNode.type).toBe('image');
      expect(reactFlowNode.data.blockType).toBe('image');
      expect(reactFlowNode.data.metadata).toEqual({
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      });
    });
  });

  describe('toReactFlowEdgeFromCanvasView', () => {
    it('CanvasViewData의 edge를 React Flow Edge로 올바르게 변환해야 한다', () => {
      // Given
      const edge = {
        edgeId: 'edge-123',
        sourceBlockId: 'block-mount-456',
        targetBlockId: 'block-mount-789',
        edgeType: 'straight'
      };

      // When
      const reactFlowEdge = toReactFlowEdgeFromCanvasView(edge);

      // Then
      expect(reactFlowEdge).toEqual({
        id: 'edge-123',
        source: 'block-mount-456',
        target: 'block-mount-789',
        type: 'straight',
        data: {
          edgeId: 'edge-123'
        }
      });
    });

    it('기본 edgeType이 없을 때 default를 사용해야 한다', () => {
      // Given
      const edge = {
        edgeId: 'edge-456',
        sourceBlockId: 'block-mount-123',
        targetBlockId: 'block-mount-456',
        edgeType: ''
      };

      // When
      const reactFlowEdge = toReactFlowEdgeFromCanvasView(edge);

      // Then
      expect(reactFlowEdge.type).toBe('default');
    });

    it('null edgeType일 때도 기본값을 사용해야 한다', () => {
      // Given
      const edge = {
        edgeId: 'edge-789',
        sourceBlockId: 'block-mount-123',
        targetBlockId: 'block-mount-456',
        edgeType: null as any
      };

      // When
      const reactFlowEdge = toReactFlowEdgeFromCanvasView(edge);

      // Then
      expect(reactFlowEdge.type).toBe('default');
    });
  });
});
