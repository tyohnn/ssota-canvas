'use server';

import { revalidatePath } from 'next/cache';

import { ActionResult, err, ok } from '@/lib';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { UpdateEdgeConnectionService } from '../../backend/services/edge/update-edge-connection.service';
import {
  UpdateEdgeConnectionRequest,
  UpdateEdgeConnectionRequestSchema,
} from '../../shared/dtos/requests/edge.requests';
import { EdgeView } from '../../shared/dtos/views/edge.views';

/**
 * 엣지 연결 정보 업데이트 (Server Action)
 * - 클래스 기반 서비스 호출 방식으로 복구
 */
export async function updateEdgeConnectionAction(
  input: UpdateEdgeConnectionRequest
): Promise<ActionResult<EdgeView>> {
  // 1. 입력값 검증
  const validationResult = UpdateEdgeConnectionRequestSchema.safeParse(input);
  if (!validationResult.success) {
    return err(validationResult.error.message);
  }

  // 2. 서비스 실행
  const edgeRepository = new DrizzleEdgeRepository();
  const service = new UpdateEdgeConnectionService(edgeRepository);
  const result = await service.execute(validationResult.data);

  // 3. 성공 시 캐시 갱신
  if (result.success) {
     revalidatePath('/canvas'); 
  }

  return result;
}
