/**
 * Beta Access Management Service
 */
import { trackEvent } from '@/lib/analytics/mixpanel/server';
import { Result } from '@/utils/result';

import type {
  ApproveBetaApplicationCommand,
  SubmitBetaApplicationCommand,
} from '../../shared/commands/beta.commands';
import type {
  BetaStatusResponse,
  UserBetaInfo,
} from '../../shared/types/beta.types';
import { UserId } from '../../shared/value-objects/ids.vo';
import type { BetaRepository } from '../repositories/interfaces/beta.repository.interface';

/**
 * Beta Service Error
 */
export class BetaServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly meta?: any
  ) {
    super(message);
    this.name = 'BetaServiceError';
  }
}

/**
 * Beta Access Management Service
 *
 * 베타 접근 관련 비즈니스 로직을 담당하는 서비스
 */
export class BetaService {
  constructor(private betaRepository: BetaRepository) {}

  /**
   * 베타 신청서 제출
   *
   * @param command - 베타 신청 Command
   * @returns 성공 또는 에러
   */
  async submitApplication(
    command: SubmitBetaApplicationCommand
  ): Promise<Result<void, BetaServiceError>> {
    try {
      // 1. 현재 베타 정보 조회
      const userId = new UserId(command.userId);
      const betaInfo = await this.betaRepository.findBetaInfoByUserId(userId);

      if (!betaInfo) {
        return Result.error(
          new BetaServiceError('USER_NOT_FOUND', 'User profile not found', {
            userId: command.userId,
          })
        );
      }

      // 2. 중복 신청 방지
      if (betaInfo.betaStatus === 'approved') {
        return Result.error(
          new BetaServiceError(
            'ALREADY_APPROVED',
            'User is already approved for beta access',
            { userId: command.userId }
          )
        );
      }

      if (betaInfo.betaApplication) {
        return Result.error(
          new BetaServiceError(
            'ALREADY_SUBMITTED',
            'User has already submitted an application',
            { userId: command.userId }
          )
        );
      }

      // 3. 신청서 제출
      await this.betaRepository.submitApplication(command);

      // 4. Track analytics event (Domain Event pattern)
      await this.trackBetaApplicationSubmitted(command);

      return Result.success(undefined);
    } catch (error) {
      console.error('[BetaService] Submit application error:', error);
      return Result.error(
        new BetaServiceError(
          'SUBMIT_FAILED',
          'Failed to submit beta application',
          { originalError: error }
        )
      );
    }
  }

  /**
   * 사용자의 베타 상태 조회
   *
   * @param userId - 사용자 ID
   * @returns 베타 상태 정보
   */
  async getBetaStatus(
    userId: UserId
  ): Promise<Result<BetaStatusResponse, BetaServiceError>> {
    try {
      const betaInfo = await this.betaRepository.findBetaInfoByUserId(userId);

      if (!betaInfo) {
        return Result.error(
          new BetaServiceError('USER_NOT_FOUND', 'User profile not found', {
            userId: userId.value,
          })
        );
      }

      return Result.success({
        beta_status: betaInfo.betaStatus,
        beta_application: betaInfo.betaApplication,
        beta_applied_at: betaInfo.betaAppliedAt?.toISOString() || null,
        beta_approved_at: betaInfo.betaApprovedAt?.toISOString() || null,
      });
    } catch (error) {
      console.error('[BetaService] Get beta status error:', error);
      return Result.error(
        new BetaServiceError('GET_STATUS_FAILED', 'Failed to get beta status', {
          originalError: error,
        })
      );
    }
  }

  /**
   * 베타 리다이렉트 경로 확인
   *
   * @param userId - 사용자 ID
   * @returns 리다이렉트 경로 또는 null (리다이렉트 불필요)
   */
  async checkBetaRedirect(
    userId: UserId
  ): Promise<Result<string | null, BetaServiceError>> {
    const statusResult = await this.getBetaStatus(userId);

    if (statusResult.isError()) {
      return Result.error(statusResult.error);
    }

    const status = statusResult.value;

    switch (status.beta_status) {
      case 'approved':
        return Result.success(null); // No redirect needed

      case 'pending':
        if (!status.beta_application) {
          return Result.success('/beta/application');
        }
        return Result.success('/beta/pending');

      default:
        return Result.success(null);
    }
  }

  /**
   * 베타 승인 여부 확인
   *
   * @param userId - 사용자 ID
   * @returns 승인 여부
   */
  async isApproved(userId: UserId): Promise<boolean> {
    return await this.betaRepository.isApproved(userId);
  }

  /**
   * 베타 신청 승인
   *
   * @param command - 승인 Command
   * @returns 성공 또는 에러
   */
  async approveApplication(
    command: ApproveBetaApplicationCommand
  ): Promise<Result<void, BetaServiceError>> {
    try {
      await this.betaRepository.approveApplication(command);
      return Result.success(undefined);
    } catch (error) {
      console.error('[BetaService] Approve application error:', error);
      return Result.error(
        new BetaServiceError(
          'APPROVE_FAILED',
          'Failed to approve beta application',
          { originalError: error }
        )
      );
    }
  }

  // ============================================
  // Analytics Tracking (Domain Event Pattern)
  // ============================================

  /**
   * Track Beta Application Submitted Event
   *
   * Similar to handleDomainEvents pattern in page-lifecycle.service.ts
   * Tracks analytics events after successful business operations
   *
   * @param command - Submit command with application data
   */
  private async trackBetaApplicationSubmitted(
    command: SubmitBetaApplicationCommand
  ): Promise<void> {
    try {
      await trackEvent('Beta Application Submitted', command.userId, {
        name: command.applicationData.name || null,
        organization: command.applicationData.organization || null,
        purpose: command.applicationData.purpose || null,
        use_case: command.applicationData.use_case || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Analytics should not break business logic
      console.error('[BetaService] Failed to track analytics:', error);
    }
  }
}
