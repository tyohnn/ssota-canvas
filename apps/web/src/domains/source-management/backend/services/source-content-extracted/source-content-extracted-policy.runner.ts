/**
 * Application Event Policy: SourceContentExtracted → App Space 저장
 * sourceType에 따라 해당 플랫폼 도메인에 구조화 데이터 저장
 *
 * NOTE: YouTube 스크립트는 sources.raw_content만 사용 (Timeline 탭: useSourceContent + parseTimelineRawContent).
 * videos.script dual-write 제거됨.
 */
import type { SourceContentExtractedEvent } from '../../../shared/events/source-content-extracted.application-event';

/**
 * 기본 Policy Runner: 추출 완료 후 처리
 * (ensureSourceSummary 등은 별도 Policy에서 처리)
 */
export async function runSourceContentExtractedPolicy(
  _event: SourceContentExtractedEvent
): Promise<void> {
  // YouTube videos.script dual-write 제거: raw_content만 sources에 저장됨
  await Promise.resolve();
}
