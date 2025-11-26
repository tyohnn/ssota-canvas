/**
 * Drizzle Beta Repository Implementation
 */

import { eq } from 'drizzle-orm';
import { adminDb } from '@/db';
import { profiles } from '@/db/schema';
import type { BetaRepository } from '../interfaces/beta.repository.interface';
import type { UserId } from '../../../shared/value-objects/ids.vo';
import type { UserBetaInfo } from '../../../shared/types/beta.types';
import type {
  SubmitBetaApplicationCommand,
  ApproveBetaApplicationCommand,
} from '../../../shared/commands/beta.commands';

/**
 * Drizzle Beta Repository
 *
 * adminDb를 사용하여 베타 접근 관련 데이터를 관리하는 Repository 구현
 */
export class DrizzleBetaRepository implements BetaRepository {
  /**
   * 사용자의 베타 정보 조회
   */
  async findBetaInfoByUserId(userId: UserId): Promise<UserBetaInfo | null> {
    const [result] = await adminDb
      .select({
        id: profiles.id,
        beta_status: profiles.beta_status,
        beta_application: profiles.beta_application,
        beta_applied_at: profiles.beta_applied_at,
        beta_approved_at: profiles.beta_approved_at,
        beta_approved_by: profiles.beta_approved_by,
      })
      .from(profiles)
      .where(eq(profiles.id, userId.value))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      userId: result.id,
      betaStatus: result.beta_status,
      betaApplication: result.beta_application as any,
      betaAppliedAt: result.beta_applied_at,
      betaApprovedAt: result.beta_approved_at,
      betaApprovedBy: result.beta_approved_by,
    };
  }

  /**
   * 베타 신청서 제출
   */
  async submitApplication(
    command: SubmitBetaApplicationCommand
  ): Promise<void> {
    await adminDb
      .update(profiles)
      .set({
        beta_application: command.applicationData,
        beta_applied_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(profiles.id, command.userId));
  }

  /**
   * 베타 신청 승인
   */
  async approveApplication(
    command: ApproveBetaApplicationCommand
  ): Promise<void> {
    await adminDb
      .update(profiles)
      .set({
        beta_status: 'approved',
        beta_approved_at: new Date(),
        beta_approved_by: command.approvedBy,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, command.userId));
  }

  /**
   * 신청서 제출 여부 확인
   */
  async hasSubmittedApplication(userId: UserId): Promise<boolean> {
    const betaInfo = await this.findBetaInfoByUserId(userId);
    return betaInfo?.betaApplication !== null;
  }

  /**
   * 승인 여부 확인
   */
  async isApproved(userId: UserId): Promise<boolean> {
    const betaInfo = await this.findBetaInfoByUserId(userId);
    return betaInfo?.betaStatus === 'approved';
  }
}
