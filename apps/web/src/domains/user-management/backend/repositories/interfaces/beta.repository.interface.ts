/**
 * Beta Repository Interface
 */

import type { UserId } from '../../../shared/value-objects/ids.vo';
import type { UserBetaInfo } from '../../../shared/types/beta.types';
import type {
  SubmitBetaApplicationCommand,
  ApproveBetaApplicationCommand,
} from '../../../shared/commands/beta.commands';

/**
 * Beta Repository Interface
 *
 * 베타 접근 관련 데이터 영속화를 담당하는 Repository 인터페이스
 */
export interface BetaRepository {
  /**
   * 사용자의 베타 정보 조회
   *
   * @param userId - 사용자 ID
   * @returns 사용자의 베타 정보 또는 null
   */
  findBetaInfoByUserId(userId: UserId): Promise<UserBetaInfo | null>;

  /**
   * 베타 신청서 제출
   *
   * @param command - 베타 신청 Command
   */
  submitApplication(command: SubmitBetaApplicationCommand): Promise<void>;

  /**
   * 베타 신청 승인
   *
   * @param command - 승인 Command
   */
  approveApplication(command: ApproveBetaApplicationCommand): Promise<void>;

  /**
   * 신청서 제출 여부 확인
   *
   * @param userId - 사용자 ID
   * @returns 신청서 제출 여부
   */
  hasSubmittedApplication(userId: UserId): Promise<boolean>;

  /**
   * 승인 여부 확인
   *
   * @param userId - 사용자 ID
   * @returns 승인 여부
   */
  isApproved(userId: UserId): Promise<boolean>;
}
