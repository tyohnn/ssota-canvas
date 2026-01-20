/**
 * Video 요약 조회 Action (특정 언어)
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. Video 조회
 * 2. 언어별 권한 확인 (action_transactions)
 * 3. 해당 언어의 요약 반환
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
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
import {
  type GetVideoSummaryByLanguageRequest,
  GetVideoSummaryByLanguageRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { GetSummaryDTO } from '../../shared/dtos/responses/video-summary.responses';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Video 요약 조회 Action (특정 언어)
 */
export const getVideoSummaryByLanguageAction = withYoutubeBlockSecureAction(
  GetVideoSummaryByLanguageRequestSchema,
  'getVideoSummaryByLanguageAction',
  getVideoSummaryByLanguageInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      youtubeId: req.youtubeId,
      language: req.language,
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
async function getVideoSummaryByLanguageInternal(
  safeDto: GetVideoSummaryByLanguageRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetSummaryDTO>> {
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

    // 6. 언어별 권한 확인 (action_transactions)
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    // 6-1. 블록 레벨 권한 확인 (언어별 summary 접근 권한)
    if (
      youtubeProperties.summaryAccessGrantedLanguages?.includes(
        safeDto.language
      )
    ) {
      // 권한 있음, 해당 언어의 요약 조회
      const summaryRepository = new DrizzleVideoSummaryRepository();
      const summaryAggregate = await summaryRepository.findByVideoIdAndLanguage(
        safeDto.youtubeId,
        safeDto.language
      );

      if (!summaryAggregate) {
        return err('Summary not found for this language', {
          code: 'SUMMARY_NOT_FOUND',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
            language: safeDto.language,
          },
        });
      }

      return ok({ summary: summaryAggregate.toView() });
    }

    // 6-2. Org 레벨 권한 확인 (언어별 action_transactions)
    if (!context.organization?.id) {
      return err(
        'Summary not extracted for this language. Please extract summary first.',
        {
          code: 'SUMMARY_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
            language: safeDto.language,
          },
        }
      );
    }

    const actionTransaction =
      await actionTransactionRepository.findByOrgVideoAndLanguage(
        context.organization.id,
        safeDto.youtubeId,
        'extract_summary',
        safeDto.language
      );

    if (!actionTransaction) {
      return err(
        'Summary not extracted for this language. Please extract summary first.',
        {
          code: 'SUMMARY_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
            language: safeDto.language,
          },
        }
      );
    }

    // 7. Summary 조회
    const summaryRepository = new DrizzleVideoSummaryRepository();
    const summaryAggregate = await summaryRepository.findByVideoIdAndLanguage(
      safeDto.youtubeId,
      safeDto.language
    );

    if (!summaryAggregate) {
      return err('Summary not found', {
        code: 'SUMMARY_NOT_FOUND',
        meta: {
          blockId: safeDto.blockId,
          videoId: safeDto.youtubeId,
          language: safeDto.language,
        },
      });
    }

    // 8. 블록에 권한 부여 (자동 복구 - 언어별)
    const currentLanguages =
      youtubeProperties.summaryAccessGrantedLanguages || [];
    if (!currentLanguages.includes(safeDto.language)) {
      block.updatePropertiesFromRecord({
        summaryAccessGrantedLanguages: [...currentLanguages, safeDto.language],
      });
      await blockRepository.update(block);
    }

    return ok({ summary: summaryAggregate.toView() });
  } catch (error) {
    console.error('[getVideoSummaryByLanguageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
