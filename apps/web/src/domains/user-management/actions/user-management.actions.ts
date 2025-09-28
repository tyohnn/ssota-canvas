'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { z } from 'zod';
import {
  UserManagementService,
  ClerkService,
} from '../services/user-management.service';
import { DrizzleUserRepository } from '../repositories/user.repository';
import { SyncClerkUserCommand } from '../commands';
import { ClerkUserSyncedEvent } from '../events';
import { ActionResult, ok, err } from '@/lib/action-result';
import { UserManagementError } from '../errors/user-management.error';
import { LoginUserCommand, LogoutUserCommand } from '../commands';
import { UserLoggedInEvent, UserLoggedOutEvent } from '../events';

export async function syncUserFromClerkAction(
  clerkUserId: string
): Promise<ActionResult<any, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService: ClerkService = {
    getUser: async (id: string) => {
      try {
        const user = await currentUser();
        if (!user || user.id !== id) {
          return null;
        }
        return {
          id: user.id,
          emailAddresses: user.emailAddresses.map(addr => ({
            emailAddress: addr.emailAddress,
          })),
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        };
      } catch (error) {
        console.error('Failed to get user from Clerk:', error);
        return null;
      }
    },
    verifyWebhook: async (payload: any, headers: Record<string, string>) => {
      try {
        const svix_id = headers['svix-id'];
        const svix_timestamp = headers['svix-timestamp'];
        const svix_signature = headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
          return false;
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
        const body = JSON.stringify(payload);

        wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });

        return true;
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return false;
      }
    },
  };

  const service = new UserManagementService(userRepository, clerkService);

  return await service.syncUserFromClerk(clerkUserId);
}

export async function syncClerkUserAction(
  input: SyncClerkUserCommand
): Promise<ActionResult<ClerkUserSyncedEvent, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Input validation
  const schema = z.object({
    clerkId: z.string().min(1),
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.enum(['active', 'soft_deleted', 'permanently_deleted']),
    metadata: z.record(z.any(), z.any()).optional(),
    webhookType: z.enum(['user.created', 'user.updated', 'user.deleted']),
  });

  const validatedInput = schema.parse(input);

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService: ClerkService = {
    getUser: async (id: string) => {
      try {
        // 실제 Clerk SDK를 사용하여 사용자 정보를 조회하지 않고,
        // Webhook에서 받은 데이터를 그대로 사용 (이미 검증됨)
        return {
          id,
          emailAddresses: [{ emailAddress: validatedInput.email }],
          firstName: validatedInput.firstName,
          lastName: validatedInput.lastName,
          imageUrl: validatedInput.imageUrl,
        };
      } catch (error) {
        console.error('Failed to process user data:', error);
        return null;
      }
    },
    verifyWebhook: async (payload: any, headers: Record<string, string>) => {
      try {
        const svix_id = headers['svix-id'];
        const svix_timestamp = headers['svix-timestamp'];
        const svix_signature = headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
          return false;
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
        const body = JSON.stringify(payload);

        wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });

        return true;
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return false;
      }
    },
  };

  const service = new UserManagementService(userRepository, clerkService);

  return await service.syncClerkUser(validatedInput);
}

export async function loginUserAction(
  input: LoginUserCommand
): Promise<ActionResult<UserLoggedInEvent, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    return err(
      new UserManagementError('AUTH_REQUIRED', 'Authentication required')
    );
  }

  // Input validation
  const schema = z.object({
    clerkUserId: z.string().min(1),
    email: z.string().email(),
    sessionId: z.string().min(1),
    loginMethod: z.enum(['email', 'oauth', 'sso']),
    timestamp: z.date(),
  });

  const validatedInput = schema.parse(input);

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService: ClerkService = {
    getUser: async (id: string) => {
      try {
        const user = await currentUser();
        if (!user || user.id !== id) {
          return null;
        }
        return {
          id: user.id,
          emailAddresses: user.emailAddresses.map(addr => ({
            emailAddress: addr.emailAddress,
          })),
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        };
      } catch (error) {
        console.error('Failed to get user from Clerk:', error);
        return null;
      }
    },
    verifyWebhook: async (payload: any, headers: Record<string, string>) => {
      try {
        const svix_id = headers['svix-id'];
        const svix_timestamp = headers['svix-timestamp'];
        const svix_signature = headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
          return false;
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
        const body = JSON.stringify(payload);

        wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });

        return true;
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return false;
      }
    },
  };

  const service = new UserManagementService(userRepository, clerkService);

  return await service.loginUser(validatedInput);
}

export async function logoutUserAction(
  input: LogoutUserCommand
): Promise<ActionResult<UserLoggedOutEvent, UserManagementError>> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) {
    return err(
      new UserManagementError('AUTH_REQUIRED', 'Authentication required')
    );
  }

  // Input validation
  const schema = z.object({
    userId: z.string().min(1),
    sessionId: z.string().min(1),
    timestamp: z.date(),
  });

  const validatedInput = schema.parse(input);

  // Repository와 Service 초기화
  const userRepository = new DrizzleUserRepository();
  const clerkService: ClerkService = {
    getUser: async (id: string) => {
      try {
        const user = await currentUser();
        if (!user || user.id !== id) {
          return null;
        }
        return {
          id: user.id,
          emailAddresses: user.emailAddresses.map(addr => ({
            emailAddress: addr.emailAddress,
          })),
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        };
      } catch (error) {
        console.error('Failed to get user from Clerk:', error);
        return null;
      }
    },
    verifyWebhook: async (payload: any, headers: Record<string, string>) => {
      try {
        const svix_id = headers['svix-id'];
        const svix_timestamp = headers['svix-timestamp'];
        const svix_signature = headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
          return false;
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
        const body = JSON.stringify(payload);

        wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });

        return true;
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return false;
      }
    },
  };

  const service = new UserManagementService(userRepository, clerkService);

  return await service.logoutUser(validatedInput);
}
