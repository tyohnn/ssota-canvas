"use server";

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { UserManagementService, ClerkService } from '../services/user-management.service';
import { DrizzleUserRepository } from '../repositories/user.repository';
import { SyncClerkUserCommand } from '../commands';
import { ClerkUserSyncedEvent } from '../events';
import { Result } from '@/lib/action-result';
import { UserManagementError } from '../errors/user-management.error';

export async function syncUserFromClerkAction(
  clerkUserId: string
): Promise<Result<any, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService = new ClerkService({
    getUser: async (id: string) => {
      // 실제 Clerk 클라이언트를 사용하는 구현이 들어갈 자리
      // 현재는 mock 데이터 반환
      return {
        id,
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null
      };
    }
  });

  const service = new UserManagementService(userRepository, clerkService);

  return await service.syncUserFromClerk(clerkUserId);
}

export async function syncClerkUserAction(
  input: SyncClerkUserCommand
): Promise<Result<ClerkUserSyncedEvent, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Input validation
  const schema = z.object({
    clerkId: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.enum(['active', 'soft_deleted', 'permanently_deleted']),
    metadata: z.record(z.any()).optional(),
    webhookType: z.enum(['user.created', 'user.updated', 'user.deleted'])
  });

  const validatedInput = schema.parse(input);

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService = new ClerkService({
    getUser: async (id: string) => {
      // 실제 Clerk 클라이언트를 사용하는 구현이 들어갈 자리
      return {
        id,
        emailAddresses: [{ emailAddress: validatedInput.email }],
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        imageUrl: validatedInput.imageUrl
      };
    }
  });

  const service = new UserManagementService(userRepository, clerkService);

  return await service.syncClerkUser(validatedInput);
}