/**
 * Extract and Update Script Service
 *
 * 스크립트 추출 및 업데이트를 담당하는 서비스
 */

import { Result } from '@/utils/result';

import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { createActionTransaction } from '../action-transaction';
import { extractTranscript } from '../youtube-api/extract-transcript.service';
import { CompleteActionTransactionCommand } from '../../../shared/commands/action-transaction.commands';
import { UpdateScriptCommand } from '../../../shared/commands/video.commands';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';

export interface ExtractAndUpdateScriptRequest {
  videoAggregate: VideoAggregate;
  blockAggregate: BlockAggregate;
  orgId: string;
  videoId: string;
  existingActionTransaction?: ActionTransactionAggregate;
  repositories: {
    videoRepository: IVideoRepository;
    blockRepository: IBlockRepository;
    actionTransactionRepository: IActionTransactionRepository;
  };
}

export interface ExtractAndUpdateScriptResult {
  videoAggregate: VideoAggregate;
}

/**
 * 스크립트 추출 및 업데이트
 *
 * @param request - 추출 및 업데이트 요청
 * @returns 처리 결과 (업데이트된 VideoAggregate)
 */
export async function extractAndUpdateScript(
  request: ExtractAndUpdateScriptRequest
): Promise<Result<ExtractAndUpdateScriptResult, YoutubeError>> {
  const { videoAggregate, blockAggregate, orgId, videoId, existingActionTransaction, repositories } = request;
  const { videoRepository, blockRepository, actionTransactionRepository } = repositories;

  const video = videoAggregate.getVideo();
  const videoSlug = video.slug.value;

  // 1. Action Transaction 생성 또는 조회 (org_id 기반)
  let actionTransactionAggregate;
  if (existingActionTransaction) {
    // 이미 확인된 Action Transaction 사용 (DB 중복 호출 방지)
    actionTransactionAggregate = existingActionTransaction;
  } else {
    // 새로 조회 또는 생성
    const existingTransaction =
      await actionTransactionRepository.findByOrgAndVideo(
        orgId,
        videoId,
        'extract_script'
      );

    if (existingTransaction) {
      actionTransactionAggregate = existingTransaction;
    } else {
      const createTransactionResult = await createActionTransaction(
        {
          orgId,
          videoId,
          actionType: 'extract_script',
        },
        actionTransactionRepository
      );

      if (createTransactionResult.isError()) {
        return Result.error(createTransactionResult.error);
      }

      actionTransactionAggregate = createTransactionResult.value;
    }
  }

  try {
    // 2. extractTranscript 호출하여 스크립트 추출
    let script;
    try {
      script = await extractTranscript(videoSlug);
    } catch (error) {
      // Action Transaction 완료 처리 (실패로 표시)
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return Result.error(
        error instanceof YoutubeError
          ? error
          : new YoutubeError(
            'TRANSCRIPT_EXTRACTION_FAILED',
            error instanceof Error
              ? error.message
              : 'Failed to extract transcript',
            {
              videoId,
              videoSlug,
              originalError:
                error instanceof Error ? error.message : String(error),
            }
          )
      );
    }

    // 3. 스크립트 업데이트
    const updateScriptCommand: UpdateScriptCommand = {
      videoId: video.id.value,
      script,
      scriptLanguage: script.metadata.language || 'auto',
    };

    videoAggregate.updateScript(updateScriptCommand);

    // 4. Repository에 저장
    await videoRepository.update(videoAggregate);

    // 5. 블록 레벨 권한 설정 (scriptAccessGranted)
    const block = blockAggregate.getBlock();
    block.updatePropertiesFromRecord({
      scriptAccessGranted: true,
    });
    await blockRepository.update(block);

    // 6. Action Transaction 완료 처리
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: actionTransactionAggregate.getTransaction().id.value,
    };
    actionTransactionAggregate.complete(completeCommand);
    await actionTransactionRepository.update(actionTransactionAggregate);

    return Result.success({
      videoAggregate,
    });
  } catch (error) {
    // Action Transaction 완료 처리 (실패로 표시)
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: actionTransactionAggregate.getTransaction().id.value,
    };
    actionTransactionAggregate.complete(completeCommand);
    await actionTransactionRepository.update(actionTransactionAggregate);

    return Result.error(
      new YoutubeError(
        'SCRIPT_EXTRACTION_FAILED',
        error instanceof Error ? error.message : 'Failed to extract video script',
        {
          videoId,
          videoSlug,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}