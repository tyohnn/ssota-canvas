'use server';

import { Result } from '@/utils/result';
import { BlockId } from '../shared/value-objects/block-id.vo';
import { CreateBlockCommand, CreateBlockRequest } from '../shared/commands';
import { BlockDTO } from '../shared/dtos';

// 임시로 에러 클래스들 정의
class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}

// Mock getCurrentUser for testing (실제로는 Supabase Auth 사용)
async function getCurrentUser() {
  // TODO: Supabase Auth 연동
  return { id: 'test-user-id' };
}

// UUID 유효성 검증 함수
function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim());
}

/**
 * Block Management Domain의 createBlockAction
 * Canvas Management에서 블럭 생성 요청 시 호출됨
 */
export async function createBlockAction(
  request: CreateBlockRequest
): Promise<Result<BlockDTO, Error>> {
  try {
    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.error(new UnauthorizedError('User not authenticated'));
    }

    // 2. 입력 유효성 검증
    if (!request.workspaceId || !isValidUUID(request.workspaceId)) {
      return Result.error(
        new InternalServerError('Invalid workspace ID format')
      );
    }

    if (!request.blockType || request.blockType.trim() === '') {
      return Result.error(new InternalServerError('Block type is required'));
    }

    // 3. Command 생성
    const command: CreateBlockCommand = {
      blockType: request.blockType,
      workspaceId: request.workspaceId,
      metadata: request.metadata || {},
      userId: user.id,
    };

    // 4. 간단한 블럭 생성 로직 (실제로는 BlockManagementService 호출)
    // TODO: BlockManagementService.createBlock(command) 호출
    const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000'); // 임시 ID

    // 4. DTO 생성
    const dto: BlockDTO = {
      id: blockId.value,
      blockType: command.blockType,
      workspaceId: command.workspaceId,
      metadata: command.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return Result.success(dto);
  } catch (error) {
    console.error('Block creation failed:', error);
    return Result.error(new InternalServerError('Block creation failed'));
  }
}
