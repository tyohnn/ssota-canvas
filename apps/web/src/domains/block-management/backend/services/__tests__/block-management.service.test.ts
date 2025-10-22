import { describe, it, expect, beforeEach } from 'vitest';
import { BlockManagementService } from '../block-management.service';
import { CreateBlockCommand } from '../../../shared/commands/index';
import { BlockManagementError } from '../../../shared/errors/block-management.error';

describe('BlockManagementService', () => {
  // 테스트용 고정 UUID (삭제 금지)
  const TEST_PROFILE_ID = '571f5680-0684-405d-b977-f6f28ff1df6f';
  const TEST_ORG_ID = 'ff215d4a-045d-499d-bf6b-07426bcc0b06';
  const TEST_WORKSPACE_ID = 'e4ee861a-4de1-42ce-820f-33866b136068';
  const TEST_PAGE_ID = '88597cb7-6828-480d-a77b-04db5ed5a142';

  let service: BlockManagementService;

  beforeEach(() => {
    service = new BlockManagementService();
  });

  describe('createBlock', () => {
    it('정상적으로 블럭을 생성할 수 있어야 한다', async () => {
      // Given
      const command: CreateBlockCommand = {
        blockType: 'text',
        workspaceId: TEST_WORKSPACE_ID,
        metadata: { content: 'Hello World' },
        userId: TEST_PROFILE_ID,
      };

      // When
      const result = await service.createBlock(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const dto = result.value;
        expect(dto.id).toBeTruthy();
        expect(dto.blockType).toBe('text');
        expect(dto.workspaceId).toBe(TEST_WORKSPACE_ID);
        expect(dto.metadata).toEqual({ content: 'Hello World' });
        expect(dto.createdAt).toBeTruthy();
        expect(dto.updatedAt).toBeTruthy();
      }
    });

    it('잘못된 workspaceId로 블럭 생성을 시도하면 INVALID_WORKSPACE_ID 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateBlockCommand = {
        blockType: 'text',
        workspaceId: 'invalid-workspace-id',
        metadata: { content: 'Hello World' },
        userId: TEST_PROFILE_ID,
      };

      // When
      const result = await service.createBlock(command);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
        expect((result.error as BlockManagementError).code).toBe('INVALID_WORKSPACE_ID');
        expect(result.error.message).toContain('Invalid workspace ID format');
      }
    });

    it('빈 blockType으로 블럭 생성을 시도하면 INVALID_BLOCK_TYPE 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateBlockCommand = {
        blockType: '',
        workspaceId: TEST_WORKSPACE_ID,
        metadata: {},
        userId: TEST_PROFILE_ID,
      };

      // When
      const result = await service.createBlock(command);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
        expect((result.error as BlockManagementError).code).toBe('INVALID_BLOCK_TYPE');
        expect(result.error.message).toContain('Block type is required');
      }
    });

    it('공백만 있는 blockType으로 블럭 생성을 시도하면 INVALID_BLOCK_TYPE 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateBlockCommand = {
        blockType: '   ',
        workspaceId: TEST_WORKSPACE_ID,
        metadata: {},
        userId: TEST_PROFILE_ID,
      };

      // When
      const result = await service.createBlock(command);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
        expect((result.error as BlockManagementError).code).toBe('INVALID_BLOCK_TYPE');
      }
    });

    it('메타데이터 없이도 블럭을 생성할 수 있어야 한다', async () => {
      // Given
      const command: CreateBlockCommand = {
        blockType: 'text',
        workspaceId: TEST_WORKSPACE_ID,
        userId: TEST_PROFILE_ID,
      };

      // When
      const result = await service.createBlock(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const dto = result.value;
        expect(dto.metadata).toEqual({});
      }
    });

    it('다양한 블럭 타입으로 블럭을 생성할 수 있어야 한다', async () => {
      // Given
      const blockTypes = ['text', 'image', 'code', 'page', 'shape'];

      for (const blockType of blockTypes) {
        const command: CreateBlockCommand = {
          blockType,
          workspaceId: TEST_WORKSPACE_ID,
          metadata: {},
          userId: TEST_PROFILE_ID,
        };

        // When
        const result = await service.createBlock(command);

        // Then
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value.blockType).toBe(blockType);
        }
      }
    });
  });
});
