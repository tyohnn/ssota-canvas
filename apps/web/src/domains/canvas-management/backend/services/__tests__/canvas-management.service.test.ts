import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasQueryService } from '../canvas-query.service';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';
import { ViewportRepository } from '../../repositories/interfaces/viewport.repository.interface';
import { CanvasViewData } from '../../../shared/dtos';
import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import { ViewportAggregate } from '../../../shared/aggregates/viewport.aggregate';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { Position } from '../../../shared/value-objects/position.vo';
import { Size } from '../../../shared/value-objects/size.vo';
import { ZOrder } from '../../../shared/value-objects/z-order.vo';
import { UserId as BlockUserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { MountBlockCommand } from '../../../shared/commands';

// Mock repositories for testing
class MockBlockMountRepository implements BlockMountRepository {
  private storage = new Map<string, BlockMountAggregate>();

  async create(blockMount: any): Promise<void> {
    // Mock implementation
  }

  async update(blockMount: any): Promise<void> {
    // Mock implementation
  }

  async findById(blockMountId: any): Promise<BlockMountAggregate | null> {
    return this.storage.get(blockMountId.value) || null;
  }

  async findByPageId(pageId: PageId): Promise<BlockMountAggregate[]> {
    return Array.from(this.storage.values()).filter(
      bm => bm.getBlockMount().pageId.value === pageId.value
    );
  }

  async softDelete(blockMountId: any): Promise<void> {
    this.storage.delete(blockMountId.value);
  }

  async findByPageIdWithBlocks(pageId: PageId): Promise<Array<{
    blockMountAggregate: BlockMountAggregate;
    blockAggregate: BlockAggregate;
  }>> {
    const blockMounts = await this.findByPageId(pageId);
    return blockMounts.map(bm => ({
      blockMountAggregate: bm,
      blockAggregate: this.createMockBlockAggregate(bm.getBlockMount().blockId.value)
    }));
  }

  private createMockBlockAggregate(blockId: string): BlockAggregate {
    const blockIdVO = new BlockId(blockId);
    const workspaceId = new WorkspaceId('test-workspace-id');
    const userId = new BlockUserId('test-user-id');
    const blockType = new BlockType('text');
    
    const block = Block.reconstitute(
      blockIdVO,
      workspaceId,
      userId,
      blockType,
      'Test Block',
      { value: {} } as any,
      [],
      new Date(),
      new Date(),
      null
    );
    
    return BlockAggregate.reconstitute(block);
  }

  clear(): void {
    this.storage.clear();
  }
}

class MockEdgeRepository implements EdgeRepository {
  async create(edgeAggregate: EdgeAggregate): Promise<void> {
    // Mock implementation
  }

  async update(edgeAggregate: EdgeAggregate): Promise<void> {
    // Mock implementation
  }

  async findById(edgeId: any): Promise<EdgeAggregate | null> {
    return null;
  }

  async findByPageId(pageId: PageId): Promise<EdgeAggregate[]> {
    return [];
  }

  async findByConnectedBlockMountId(blockMountId: any): Promise<EdgeAggregate[]> {
    return [];
  }

  async delete(edgeId: any): Promise<void> {
    // Mock implementation
  }

  async deleteAll(edgeIds: EdgeId[]): Promise<void> {
    // Mock implementation
  }
}

class MockViewportRepository implements ViewportRepository {
  async save(viewportAggregate: ViewportAggregate): Promise<void> {
    // Mock implementation
  }

  async findById(viewportId: any): Promise<ViewportAggregate | null> {
    return null;
  }

  async findByPageId(pageId: PageId): Promise<ViewportAggregate | null> {
    return null;
  }

  async delete(viewportId: any): Promise<void> {
    // Mock implementation
  }
}

describe('CanvasQueryService', () => {
  // 테스트용 고정 UUID (삭제 금지)
  const TEST_PROFILE_ID = '571f5680-0684-405d-b977-f6f28ff1df6f';
  const TEST_ORG_ID = 'ff215d4a-045d-499d-bf6b-07426bcc0b06';
  const TEST_WORKSPACE_ID = 'e4ee861a-4de1-42ce-820f-33866b136068';
  const TEST_PAGE_ID = '88597cb7-6828-480d-a77b-04db5ed5a142';
  
  let service: CanvasQueryService;
  let mockBlockMountRepository: MockBlockMountRepository;
  let mockEdgeRepository: MockEdgeRepository;
  let mockViewportRepository: MockViewportRepository;
  let pageId: PageId;
  let userId: UserId;

  beforeEach(() => {
    mockBlockMountRepository = new MockBlockMountRepository();
    mockEdgeRepository = new MockEdgeRepository();
    mockViewportRepository = new MockViewportRepository();
    
    service = new CanvasQueryService(
      mockBlockMountRepository,
      mockEdgeRepository,
      mockViewportRepository
    );
    
    pageId = new PageId(TEST_PAGE_ID);
    userId = new UserId(TEST_PROFILE_ID);
    mockBlockMountRepository.clear();
  });

  describe('getCanvasView', () => {
    it('정상적으로 캔버스 뷰 데이터를 조회할 수 있어야 한다', async () => {
      // Given
      // Mock이 기본적으로 접근 허용하고 빈 데이터 반환

      // When
      const result = await service.getCanvasView(pageId, userId);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const canvasViewData = result.value;
        expect(canvasViewData.pageId).toBe(pageId.value);
        expect(Array.isArray(canvasViewData.blocks)).toBe(true);
        expect(Array.isArray(canvasViewData.edges)).toBe(true);
        expect(canvasViewData.viewport).toBeNull(); // Mock에서 null 반환
      }
    });

    it('페이지에 블럭이 있을 때 올바른 형식으로 반환해야 한다', async () => {
      // Given
      const blockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440123');
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440456');
      const position = new Position(100, 200);
      const size = new Size(150, 250);

      const mountCommand: MountBlockCommand = {
        blockMountId,
        pageId,
        blockId,
        position,
        size,
        userId,
      };

      const blockMountAggregate = BlockMountAggregate.mountBlock(mountCommand);
      
      // Store in the mock repository
      mockBlockMountRepository['storage'].set(
        blockMountId.value,
        blockMountAggregate
      );

      // When
      const result = await service.getCanvasView(pageId, userId);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const canvasViewData = result.value;
        expect(canvasViewData.blocks).toHaveLength(1);
        
        const block = canvasViewData.blocks[0];
        expect(block).toBeDefined();
        if (block) {
          expect(block.blockMountId).toBe(blockMountId.value);
          expect(block.blockId).toBe(blockId.value);
          expect(block.position).toEqual({ x: 100, y: 200 });
          expect(block.size).toEqual({ width: 150, height: 250 });
          expect(block.zOrder).toBe(0); // ZOrder is 0 by default in mountBlock
          expect(block.blockType).toBe('text'); // Mock에서 반환하는 타입
        }
      }
    });
  });
});