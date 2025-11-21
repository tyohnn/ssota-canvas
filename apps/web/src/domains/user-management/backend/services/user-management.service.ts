// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../shared/aggregates/user.aggregate';
import { UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';
import { Result } from '@/utils/result';
import { CreateUserProfileCommand } from '../../shared/commands';

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private supabaseAuthService: SupabaseAuthService
  ) {}

  async createUserProfile(
    command: CreateUserProfileCommand
  ): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      // 1. Supabase Auth에서 사용자 확인
      const supabaseUser = await this.supabaseAuthService.getCurrentUser();

      if (!supabaseUser || supabaseUser.id !== command.userId) {
        return Result.error(
          new UserManagementError(
            'USER_NOT_FOUND',
            'User not found in Supabase Auth'
          )
        );
      }

      // 2. 기존 프로필 확인
      const existingUser = await this.userRepository.findById(
        new UserId(command.userId)
      );
      if (existingUser) {
        // 업데이트 (Supabase User 객체 생성 필요)
        const supabaseUserObj = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: {
            name: supabaseUser.name,
            avatar_url: supabaseUser.avatarUrl,
          },
          created_at: supabaseUser.createdAt.toISOString(),
        };
        // @ts-expect-error - simplified supabase user object
        existingUser.updateFromSupabaseAuth(supabaseUserObj);
        await this.userRepository.save(existingUser);
        return Result.success(existingUser);
      }

      // 3. 신규 프로필 생성
      const supabaseUserObj = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        user_metadata: {
          name: supabaseUser.name,
          avatar_url: supabaseUser.avatarUrl,
        },
        created_at: supabaseUser.createdAt.toISOString(),
      };
      // @ts-expect-error - simplified supabase user object
      const newUser = UserAggregate.createFromSupabaseAuth(supabaseUserObj);
      await this.userRepository.save(newUser);

      return Result.success(newUser);
    } catch (error) {
      console.error('[UserManagementService] Profile creation error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return Result.error(
        new UserManagementError(
          'PROFILE_CREATION_FAILED',
          'Failed to create user profile',
          {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
          }
        )
      );
    }
  }
}
