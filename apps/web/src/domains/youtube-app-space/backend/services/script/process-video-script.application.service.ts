/**
 * Video Script 처리 서비스
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 서비스
 * - 스크립트가 있는지 확인
 * - 없으면 Action Transaction 확인 (org 레벨 권한 확인)
 * - 권한이 있으면 Transcript 추출 (YouTube API)
 * - 권한이 없어도 스크립트가 없으면 자동 추출 (스크립트 탭 클릭 시 사용자 명시적 요청)
 * - Video Aggregate 스크립트 업데이트
 * - 블록 권한 업데이트
 * - Action Transaction 완료
 */

import { Result } from '@/utils/result';

import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { extractAndUpdateScript } from './extract-and-update-script.service';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';
import type { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';
import { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';

export interface ProcessVideoScriptServiceRequest {
  orgId: string; // Action Transaction 생성을 위한 orgId
  videoId: string; // Video ID (UUID)
  block: Block; // 검증된 Block Entity
  youtubeProperties: YoutubeBlockPropertiesVO;
}

export interface ProcessVideoScriptServiceResult {
  videoAggregate: VideoAggregate; // 업데이트된 Video Aggregate
}

/**
 * Video Script 처리 서비스
 *
 * 비즈니스 로직 오케스트레이션:
 * 1. 스크립트가 있는지 확인
 * 2. 없으면 Action Transaction 확인 (org 레벨 권한 확인)
 * 3. 권한이 있으면 Transcript 추출 (YouTube API)
 * 4. 권한이 없어도 스크립트가 없으면 자동 추출 (스크립트 탭 클릭 시 사용자 명시적 요청)
 * 5. Video Aggregate 스크립트 업데이트
 * 6. 블록 권한 업데이트 (scriptAccessGranted)
 * 7. Action Transaction 완료 처리
 *
 * @param request - 처리 요청
 * @param repositories - 필요한 Repository들
 * @returns 처리 결과 (업데이트된 Video Aggregate)
 */
export async function processVideoScriptService(
  request: ProcessVideoScriptServiceRequest,
  repositories: {
    videoRepository: IVideoRepository;
    blockRepository: IBlockRepository;
    actionTransactionRepository: IActionTransactionRepository;
  }
): Promise<Result<ProcessVideoScriptServiceResult, YoutubeError>> {
  const { orgId, videoId, block, youtubeProperties } = request;
  const { videoRepository, actionTransactionRepository } =
    repositories;

  // 1. Video Aggregate 조회
  const videoAggregate = await videoRepository.findById(videoId);
  if (!videoAggregate) {
    return Result.error(
      new YoutubeError('YOUTUBE_NOT_FOUND', 'Video not found', { videoId })
    );
  }

  const video = videoAggregate.getVideo();

  // 2. Block Aggregate 변환 (이미 검증된 Block Entity 사용)
  const blockAggregate = BlockAggregate.reconstitute(block);

  // 3. Action Transaction 확인 (org 레벨 권한 확인)
  // 3-1. 블록의 scriptAccessGranted 확인 (빠른 경로)
  if (youtubeProperties.scriptAccessGranted === true) {
    // 권한이 있으면 스크립트 확인 및 반환 또는 추출
    if (video.hasScript()) {
      // 이미 스크립트가 있으면 그대로 반환
      return Result.success({
        videoAggregate,
      });
    }
    // 어떤 이유로 인해 영상 자체에 스크립트가 누락된 경우
    // (자주 안나오는 케이스)
    return await extractAndUpdateScript({
      videoAggregate,
      blockAggregate,
      orgId,
      videoId,
      existingActionTransaction: undefined,
      repositories,
    });
  }

  // 3-2. org의 action_transactions 확인
  // scriptAccessGranted가 비어있는 경우
  // a. private workspace에서 이전에 요약했던 url을 아예 새로운 블록으로 만든 경우 (새로운 블록이라서 scriptAccessGranted가 비어있음)
  // b. published page에서 a의 블록의 에디터 패널을 연 적이 없어서 scriptAccessGranted가 업데이트되지 않은 경우
  // c. publised page에서 a의 블록의 에디터 패널을 열어서 scriptAccessGranted를 업데이트한 경우에는 3-1로 넘어감. *권한 체크는 action에서 엄격하게 진행되었음.
  const actionTransaction = await actionTransactionRepository.findByOrgAndVideo(
    orgId,
    videoId,
    'extract_script'
  );

  if (actionTransaction) {
    // 이미 추출했던 유튜브 링크를 아예 새로운 블록으로 추가한 경우에 scriptAccessGranted가 비어있음
    // org 단위로 이미 추출했던 경우로 바로 스크립트 제공
    if (video.hasScript()) {
      // 이미 스크립트가 있으면 그대로 반환
      return Result.success({
        videoAggregate,
      });
    }
    // 어떤 이유로 인해 영상 자체에 스크립트가 누락된 경우
    // 자주 안나오는 케이스
    return await extractAndUpdateScript({
      videoAggregate,
      blockAggregate,
      orgId,
      videoId,
      existingActionTransaction: actionTransaction,
      repositories,
    });
  }

  // 권한이 없어도 스크립트가 없으면 자동으로 추출
  // 스크립트 탭을 클릭했을 때 사용자가 명시적으로 요청한 것이므로 추출 허용
  // (extractAndUpdateSummary와 동일한 로직)
  if (!video.hasScript()) {
    return await extractAndUpdateScript({
      videoAggregate,
      blockAggregate,
      orgId,
      videoId,
      existingActionTransaction: undefined,
      repositories,
    });
  }

  // 스크립트가 이미 있으면 그대로 반환
  return Result.success({
    videoAggregate,
  });
}