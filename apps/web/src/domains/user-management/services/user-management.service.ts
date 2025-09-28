import { UserAggregate } from '../aggregates/user.aggregate';
import { UserRepository } from '../repositories/user.repository';
import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { SyncClerkUserCommand } from '../commands';
import { ClerkUserSyncedEvent } from '../events';
import { UserManagementError } from '../errors/user-management.error';
import { ActionResult, ok, err } from '@/lib/action-result';

export interface ClerkService {
  getUser(clerkUserId: string): Promise<any | null>;
  verifyWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<boolean>;
}

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private clerkService: ClerkService
  ) {}

  async syncUserFromClerk(
    clerkUserId: string
  ): Promise<ActionResult<UserAggregate, UserManagementError>> {
    try {
      // 1. Clerk에서 사용자 정보 조회
      const clerkUser = await this.clerkService.getUser(clerkUserId);
      if (!clerkUser) {
        return err(
          new UserManagementError('USER_NOT_FOUND', 'User not found in Clerk')
        );
      }

      // 2. 기존 사용자 확인
      const existingUser = await this.userRepository.findByClerkId(clerkUserId);

      if (existingUser) {
        // 업데이트
        const event = existingUser.updateFromClerkUser(clerkUser);
        await this.userRepository.save(existingUser);
        return ok(existingUser);
      } else {
        // 신규 생성
        const newUser = UserAggregate.createFromClerkUser(clerkUser);
        await this.userRepository.save(newUser);

        return ok(newUser);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return err(
        new UserManagementError(
          'CLERK_SYNC_FAILED',
          'Failed to sync user from Clerk',
          { originalError: errorMessage }
        )
      );
    }
  }

  async syncClerkUser(
    command: SyncClerkUserCommand
  ): Promise<ActionResult<ClerkUserSyncedEvent, UserManagementError>> {
    try {
      // 1. 입력 유효성 검사
      const email = new UserEmail(command.email);

      // 2. Clerk 사용자 상태에 따른 처리
      if (command.webhookType === 'user.deleted') {
        // 소프트 삭제 처리
        const existingUser = await this.userRepository.findByClerkId(
          command.clerkId
        );
        if (existingUser) {
          existingUser.entity.softDelete();
          await this.userRepository.save(existingUser);
        }
      } else {
        // 생성 또는 업데이트 처리
        const existingUser = await this.userRepository.findByClerkId(
          command.clerkId
        );

        if (existingUser) {
          // 업데이트
          const event = existingUser.updateFromClerkUser({
            id: command.clerkId,
            emailAddresses: [{ emailAddress: command.email }],
            firstName: command.firstName,
            lastName: command.lastName,
            imageUrl: command.imageUrl,
          });
          await this.userRepository.save(existingUser);
        } else {
          // 신규 생성
          const newUser = UserAggregate.createFromClerkUser({
            id: command.clerkId,
            emailAddresses: [{ emailAddress: command.email }],
            firstName: command.firstName,
            lastName: command.lastName,
            imageUrl: command.imageUrl,
          });
          await this.userRepository.save(newUser);
        }
      }

      // 3. 성공 이벤트 반환
      const event = new ClerkUserSyncedEvent(
        command.clerkId,
        command.clerkId,
        command.email,
        command.status
      );

      return ok(event);
    } catch (error) {
      if (error instanceof UserManagementError) {
        return err(error);
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return err(
        new UserManagementError(
          'CLERK_SYNC_FAILED',
          'Failed to sync user from Clerk',
          { originalError: errorMessage }
        )
      );
    }
  }
}
