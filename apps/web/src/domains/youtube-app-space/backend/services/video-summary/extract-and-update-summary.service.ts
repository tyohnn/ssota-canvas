/**
 * Extract and Update Summary Service
 *
 * 요약 추출 및 업데이트를 담당하는 서비스
 */

import { Result } from '@/utils/result';

import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { createActionTransaction } from '../action-transaction';
import { processVideoScriptService } from '../script';
import { extractAndUpdateScript } from '../script/extract-and-update-script.service';
import { generateVideoSummary } from './generate-video-summary.service';
import { createVideoSummary } from './create-video-summary.service';
import { CompleteActionTransactionCommand } from '../../../shared/commands/action-transaction.commands';
import type { CreateVideoSummaryRequest } from '../../../shared/dtos/requests/video-summary.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import type { IVideoSummaryRepository } from '../../repositories/interfaces/video-summary.repository.interface';
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import type { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';

export interface ExtractAndUpdateSummaryRequest {
  block: Block;
  orgId: string;
  videoId: string;
  language: string;
  repositories: {
    videoRepository: IVideoRepository;
    blockRepository: IBlockRepository;
    videoSummaryRepository: IVideoSummaryRepository;
    actionTransactionRepository: IActionTransactionRepository;
  };
  youtubeProperties: YoutubeBlockPropertiesVO;
  existingActionTransaction?: ActionTransactionAggregate;
}

export interface ExtractAndUpdateSummaryResult {
  summaryAggregate: VideoSummaryAggregate;
}

/**
 * 요약 추출 및 업데이트
 *
 * @param request - 추출 및 업데이트 요청
 * @returns 처리 결과 (생성된 VideoSummaryAggregate)
 */
export async function extractAndUpdateSummary(
  request: ExtractAndUpdateSummaryRequest
): Promise<Result<ExtractAndUpdateSummaryResult, YoutubeError>> {
  const { block, orgId, videoId, language, repositories, youtubeProperties, existingActionTransaction } = request;
  const { videoRepository, blockRepository, videoSummaryRepository, actionTransactionRepository } = repositories;

  // 1. Video Aggregate 조회
  const videoAggregate = await videoRepository.findById(videoId);
  if (!videoAggregate) {
    return Result.error(
      new YoutubeError('YOUTUBE_NOT_FOUND', 'Video not found', { videoId })
    );
  }

  // 2. 스크립트 처리 (있으면 그대로, 없으면 자동으로 처리)
  const processScriptResult = await processVideoScriptService(
    {
      orgId,
      videoId,
      block,
      youtubeProperties,
    },
    {
      videoRepository,
      blockRepository,
      actionTransactionRepository,
    }
  );

  if (processScriptResult.isError()) {
    return Result.error(processScriptResult.error);
  }

  // 업데이트된 aggregate 사용
  let updatedAggregate = processScriptResult.value.videoAggregate;
  let video = updatedAggregate.getVideo();

  // 스크립트가 없으면 자동으로 추출 (요약 추출을 위해 필요)
  // processVideoScriptService에서 이미 Action Transaction을 확인했고,
  // 권한이 없어서 스크립트 추출을 하지 않은 경우이므로 여기서 직접 추출
  if (!video.hasScript()) {
    // Block Aggregate 변환 (스크립트 추출에 필요)
    const blockAggregate = BlockAggregate.reconstitute(block);

    // 스크립트 추출 (extractAndUpdateScript 내부에서 Action Transaction 조회/생성)
    const extractScriptResult = await extractAndUpdateScript({
      videoAggregate: updatedAggregate,
      blockAggregate,
      orgId,
      videoId,
      existingActionTransaction: undefined, // 새로 생성하도록 (processVideoScriptService에서 이미 확인했고 없었음)
      repositories: {
        videoRepository,
        blockRepository,
        actionTransactionRepository,
      },
    });

    if (extractScriptResult.isError()) {
      return Result.error(extractScriptResult.error);
    }

    // 추출된 스크립트가 포함된 aggregate 사용
    updatedAggregate = extractScriptResult.value.videoAggregate;
    video = updatedAggregate.getVideo();

    // 여전히 스크립트가 없으면 에러 (추출 실패)
    if (!video.hasScript()) {
      return Result.error(
        new YoutubeError('SCRIPT_NOT_FOUND', 'Failed to extract script for summary generation', {
          videoId,
        })
      );
    }
  }

  // 3. Action Transaction 확인 또는 생성 (org_id, video_id, action_type, language 기반)
  // Unique constraint로 인해 같은 (org_id, video_id, action_type, language) 조합은 하나만 존재
  let actionTransactionAggregate;
  if (existingActionTransaction) {
    // 이미 확인된 Action Transaction 사용 (DB 중복 호출 방지)
    actionTransactionAggregate = existingActionTransaction;
  } else {
    // 새로 조회 또는 생성
    const existingTransaction = await actionTransactionRepository.findByOrgVideoAndLanguage(
      orgId,
      videoId,
      'extract_summary',
      language
    );

    if (existingTransaction) {
      // 기존 트랜잭션이 있으면 재사용
      actionTransactionAggregate = existingTransaction;
    } else {
      // 새 트랜잭션 생성
      const createTransactionResult = await createActionTransaction(
        {
          orgId,
          videoId,
          actionType: 'extract_summary',
          language,
        },
        actionTransactionRepository
      );

      if (createTransactionResult.isError()) {
        return Result.error(createTransactionResult.error);
      }

      actionTransactionAggregate = createTransactionResult.value;
    }
  }

  // 4. Block Aggregate 변환 (이미 검증된 Block Entity 사용)
  const blockAggregate = BlockAggregate.reconstitute(block);

  try {
    // 5. 요약 생성 (모든 언어에 대해 직접 생성)
    const generateResult = await generateVideoSummary({
      videoAggregate: updatedAggregate,
      language,
    });

    if (generateResult.isError()) {
      // Action Transaction 완료 처리 (실패로 표시)
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return Result.error(generateResult.error);
    }

    const result = generateResult.value;
    const summaryText = result.summary;
    const keywords = result.keywords;

    // 6. VideoSummary 생성 및 저장 (이미 존재하는지 먼저 확인)
    const existingSummaryBeforeCreate = await videoSummaryRepository.findByVideoIdAndLanguage(updatedAggregate.getVideo().id.value, language);

    if (existingSummaryBeforeCreate) {
      // 이미 존재하면 기존 것을 사용
      const summaryAggregate = existingSummaryBeforeCreate;

      // 블록 레벨 권한 설정 (summaryAccessGrantedLanguages)
      const blockAggregate = BlockAggregate.reconstitute(block);
      const currentLanguages = blockAggregate.getBlock().getAllProperties().summaryAccessGrantedLanguages || [];
      if (!currentLanguages.includes(language)) {
        const block = blockAggregate.getBlock();
        block.updatePropertiesFromRecord({
          summaryAccessGrantedLanguages: [...currentLanguages, language],
        });
        await blockRepository.update(block);
      }

      // Action Transaction 완료 처리
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return Result.success({
        summaryAggregate,
      });
    }

    const createSummaryRequest: CreateVideoSummaryRequest = {
      videoId: updatedAggregate.getVideo().id.value,
      language,
      summary: summaryText,
      keywords,
    };

    const createSummaryResult = await createVideoSummary(
      createSummaryRequest,
      videoSummaryRepository
    );

    if (createSummaryResult.isError()) {
      // Action Transaction 완료 처리 (실패로 표시)
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return Result.error(createSummaryResult.error);
    }

    const summaryAggregate = createSummaryResult.value;

    // 7. 블록 레벨 권한 설정 (summaryAccessGrantedLanguages)
    // 언어별 접근 권한을 배열로 관리
    const currentLanguages = blockAggregate.getBlock().getAllProperties().summaryAccessGrantedLanguages || [];
    if (!currentLanguages.includes(language)) {
      const block = blockAggregate.getBlock();
      block.updatePropertiesFromRecord({
        summaryAccessGrantedLanguages: [...currentLanguages, language],
      });
      await blockRepository.update(block);
    }

    // 8. Action Transaction 완료 처리
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: actionTransactionAggregate.getTransaction().id.value,
    };
    actionTransactionAggregate.complete(completeCommand);
    await actionTransactionRepository.update(actionTransactionAggregate);

    return Result.success({
      summaryAggregate,
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
        'EXTRACT_SUMMARY_FAILED',
        error instanceof Error ? error.message : 'Failed to extract video summary',
        {
          videoId,
          language,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}