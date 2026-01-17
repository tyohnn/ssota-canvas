/**
 * Channel Response DTOs
 *
 * Server Action에서 반환하는 Response DTO 타입 정의
 * ⚠️ DTO는 plain object여야 함 (클래스 불가, 직렬화 가능해야 함)
 */
import type { ChannelView } from '../views';

/**
 * Channel 생성 후 반환되는 DTO (ChannelView와 동일 - SSOT)
 */
export interface CreateChannelDTO {
  channel: ChannelView;
}
