/**
 * Video 요약 조회 Action (Action Transaction 확인 포함)
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. Video 조회 (youtubeId로)
 * 2. 2단계 권한 확인:
 *    - 1단계: 블록의 summaryAccessGrantedLanguages 확인 (빠른 경로)
 *    - 2단계: org의 action_transactions 확인 (자동 복구 및 조직 내 공유)
 * 3. 요약이 있으면 반환
 * 4. 요약이 없으면 에러 반환 (자동 추출하지 않음)
 *
 * ⚠️ 중요: org 기반 권한 관리로 같은 org 내 워크스페이스 간 자동 공유
 * - Action Transaction을 확인하여 같은 조직의 다른 블록에서 추출한 요약 재사용 가능
 * - 언어별로 크레딧을 따로 받으므로 summaryAccessGrantedLanguages 배열로 관리
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '../../../block-management/shared/value-objects/block-properties';
import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
import {
  type GetVideoSummariesRequest,
  GetVideoSummariesRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { GetSummariesDTO } from '../../shared/dtos/responses/video-summary.responses';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Video 요약 조회 Action (Action Transaction 확인 포함)
 *
 * - 인증 필요
 * - Action Transaction을 확인하여 조직 내 공유된 요약 재사용 가능
 * - 블록의 summaryAccessGrantedLanguages에 언어가 없어도 org의 action_transactions를 확인하여 자동 복구
 */
export const getVideoSummaryAction = withYoutubeBlockSecureAction(
  GetVideoSummariesRequestSchema,
  'getVideoSummaryAction',
  getVideoSummaryInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      youtubeId: req.youtubeId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function getVideoSummaryInternal(
  safeDto: GetVideoSummariesRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetSummariesDTO>> {
  try {
    // 1. Block 조회하여 youtubeId 추출 (검증용)
    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findById(new BlockId(safeDto.blockId));

    if (!block) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    // 2. Block 타입이 youtube인지 확인
    if (block.blockType.value !== 'youtube') {
      return err('Block is not a YouTube block', {
        code: 'INVALID_BLOCK_TYPE',
      });
    }

    // 3. Block Properties를 타입 안전하게 변환
    const properties = block.properties;
    let youtubeProperties: YoutubeBlockPropertiesVO;
    try {
      const propertiesJSON = properties.toJSON() as YoutubeBlockProperties;
      youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(propertiesJSON);
    } catch (error) {
      return err('Invalid YouTube block properties', {
        code: 'INVALID_BLOCK_PROPERTIES',
        meta: {
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    // 4. youtubeId 추출 및 검증
    const blockYoutubeId = youtubeProperties.youtubeId;
    if (!blockYoutubeId) {
      return err('YouTube ID not found in block properties', {
        code: 'YOUTUBE_ID_NOT_FOUND',
      });
    }

    // 5. Block properties의 youtubeId와 요청의 youtubeId가 일치하는지 검증
    if (blockYoutubeId !== safeDto.youtubeId) {
      return err('YouTube ID mismatch', {
        code: 'YOUTUBE_ID_MISMATCH',
      });
    }

    // 6. Video 조회 (youtubeId는 UUID이므로 findById 사용)
    const videoRepository = new DrizzleVideoRepository();
    const aggregate = await videoRepository.findById(safeDto.youtubeId);

    if (!aggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    // 7. 2단계 권한 확인: 블록 레벨 → Org 레벨 (Action Transaction 확인)
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();
    const videoSummaryRepository = new DrizzleVideoSummaryRepository();

    // 7-1. 1단계: 블록의 summaryAccessGrantedLanguages 확인 (빠른 경로)
    // 다국어 구조: summaryAccessGrantedLanguages 배열에 언어가 있는지 확인
    const hasAnyLanguageAccess =
      youtubeProperties.summaryAccessGrantedLanguages &&
      youtubeProperties.summaryAccessGrantedLanguages.length > 0;
    if (hasAnyLanguageAccess) {
      // 블록 권한이 있으면 요약이 있는지 확인 (action_transactions 조회 없음)
      const summaries = await videoSummaryRepository.findAllByVideoId(
        safeDto.youtubeId
      );
      if (summaries.length > 0) {
        const response: GetSummariesDTO = {
          summaries: summaries.map(s => s.toView()),
          video: aggregate.toView(),
        };
        return ok(response);
      }
      // 요약이 없으면 에러 반환 (자동 추출하지 않음)
      return err('Summary not found', {
        code: 'SUMMARY_NOT_FOUND',
        meta: {
          blockId: safeDto.blockId,
          videoId: safeDto.youtubeId,
        },
      });
    } else {
      // 7-2. 2단계: org의 action_transactions 확인 (자동 복구)
      // ⚠️ 익명 유저의 경우 context.organization.id가 없을 수 있으므로 체크
      if (!context.organization?.id) {
        // 익명 유저이고 summaryAccessGrantedLanguages에 언어가 없으면 권한 없음
        return err('Summary not extracted. Please extract summary first.', {
          code: 'SUMMARY_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
          },
        });
      }

      // extract_summary 액션이 하나라도 있는지 확인
      const summaries = await videoSummaryRepository.findAllByVideoId(
        safeDto.youtubeId
      );

      if (summaries.length === 0) {
        return err('Summary not extracted. Please extract summary first.', {
          code: 'SUMMARY_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
          },
        });
      }

      // 각 언어별로 권한 확인
      const authorizedSummaries = [];
      for (const summary of summaries) {
        const summaryEntity = summary.getSummary();
        const actionTransaction =
          await actionTransactionRepository.findByOrgVideoAndLanguage(
            context.organization.id,
            safeDto.youtubeId,
            'extract_summary',
            summaryEntity.language.value
          );

        if (actionTransaction) {
          authorizedSummaries.push(summary);
        }
      }

      if (authorizedSummaries.length === 0) {
        return err('Summary not extracted. Please extract summary first.', {
          code: 'SUMMARY_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
          },
        });
      }

      // org가 이미 추출했으면 블록에 권한 부여 (자동 복구)
      // 권한이 있는 언어들을 블록에 추가
      const currentLanguages =
        youtubeProperties.summaryAccessGrantedLanguages || [];
      const authorizedLanguages = authorizedSummaries.map(s =>
        s.getSummary().language.value
      );
      const newLanguages = authorizedLanguages.filter(
        lang => !currentLanguages.includes(lang)
      );

      if (newLanguages.length > 0) {
        block.updatePropertiesFromRecord({
          summaryAccessGrantedLanguages: [...currentLanguages, ...newLanguages],
        });
        await blockRepository.update(block);
      }

      // 요약이 있으면 반환
      const response: GetSummariesDTO = {
        summaries: authorizedSummaries.map(s => s.toView()),
        video: aggregate.toView(),
      };
      return ok(response);
    }
  } catch (error) {
    console.error('[getVideoSummaryInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
