import { vi, describe, it, expect } from 'vitest';
import { handleClerkWebhook } from '../../infrastructure/clerk-webhook.handler';

describe('Clerk Webhook E2E', () => {
  describe('User Creation Flow', () => {
    it('should handle user.created webhook and sync to database', async () => {
      const mockWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [{ email_address: 'newuser@example.com' }],
          first_name: 'New',
          last_name: 'User',
          image_url: 'https://example.com/avatar.jpg'
        }
      };

      const mockHeaders = {
        'svix-id': 'msg_123',
        'svix-timestamp': new Date().toISOString(),
        'svix-signature': 'mock_signature'
      };

      // Mock the webhook verification
      const verifyClerkWebhook = vi.fn().mockResolvedValue(true);

      // Mock the sync action to return success
      const mockSyncAction = vi.fn().mockResolvedValue({
        isSuccess: () => true,
        value: {
          userId: 'user_123',
          clerkId: 'clerk_user_123',
          email: 'newuser@example.com',
          status: 'active'
        }
      });

      // Replace the handler's dependencies
      const originalHandler = require('../../infrastructure/clerk-webhook.handler');
      originalHandler.verifyClerkWebhook = verifyClerkWebhook;
      originalHandler.syncClerkUserAction = mockSyncAction;

      const result = await handleClerkWebhook(mockWebhookPayload, mockHeaders);

      expect(verifyClerkWebhook).toHaveBeenCalledWith(mockWebhookPayload, mockHeaders);
      expect(mockSyncAction).toHaveBeenCalledWith({
        clerkId: 'clerk_user_123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
        status: 'active',
        metadata: mockWebhookPayload.data,
        webhookType: 'user.created'
      });
      expect(result.success).toBe(true);
    });

    it('should handle user.updated webhook and update existing user', async () => {
      const mockWebhookPayload = {
        type: 'user.updated',
        data: {
          id: 'clerk_user_123',
          email_addresses: [{ email_address: 'updated@example.com' }],
          first_name: 'Updated',
          last_name: 'User',
          image_url: 'https://example.com/new-avatar.jpg'
        }
      };

      const mockHeaders = {
        'svix-id': 'msg_124',
        'svix-timestamp': new Date().toISOString(),
        'svix-signature': 'mock_signature'
      };

      const verifyClerkWebhook = vi.fn().mockResolvedValue(true);
      const mockSyncAction = vi.fn().mockResolvedValue({
        isSuccess: () => true,
        value: {
          userId: 'user_123',
          clerkId: 'clerk_user_123',
          email: 'updated@example.com',
          status: 'active'
        }
      });

      const originalHandler = require('../../infrastructure/clerk-webhook.handler');
      originalHandler.verifyClerkWebhook = verifyClerkWebhook;
      originalHandler.syncClerkUserAction = mockSyncAction;

      const result = await handleClerkWebhook(mockWebhookPayload, mockHeaders);

      expect(verifyClerkWebhook).toHaveBeenCalledWith(mockWebhookPayload, mockHeaders);
      expect(mockSyncAction).toHaveBeenCalledWith({
        clerkId: 'clerk_user_123',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        imageUrl: 'https://example.com/new-avatar.jpg',
        status: 'active',
        metadata: mockWebhookPayload.data,
        webhookType: 'user.updated'
      });
      expect(result.success).toBe(true);
    });

    it('should handle user.deleted webhook and soft delete user', async () => {
      const mockWebhookPayload = {
        type: 'user.deleted',
        data: {
          id: 'clerk_user_123'
        }
      };

      const mockHeaders = {
        'svix-id': 'msg_125',
        'svix-timestamp': new Date().toISOString(),
        'svix-signature': 'mock_signature'
      };

      const verifyClerkWebhook = vi.fn().mockResolvedValue(true);
      const mockSyncAction = vi.fn().mockResolvedValue({
        isSuccess: () => true,
        value: {
          userId: 'user_123',
          clerkId: 'clerk_user_123',
          email: 'deleted@example.com',
          status: 'soft_deleted'
        }
      });

      const originalHandler = require('../../infrastructure/clerk-webhook.handler');
      originalHandler.verifyClerkWebhook = verifyClerkWebhook;
      originalHandler.syncClerkUserAction = mockSyncAction;

      const result = await handleClerkWebhook(mockWebhookPayload, mockHeaders);

      expect(verifyClerkWebhook).toHaveBeenCalledWith(mockWebhookPayload, mockHeaders);
      expect(mockSyncAction).toHaveBeenCalledWith({
        clerkId: 'clerk_user_123',
        email: '',
        status: 'soft_deleted',
        metadata: mockWebhookPayload.data,
        webhookType: 'user.deleted'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook verification failure', async () => {
      const mockWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [{ email_address: 'test@example.com' }]
        }
      };

      const mockHeaders = {
        'svix-id': 'msg_123',
        'svix-timestamp': new Date().toISOString(),
        'svix-signature': 'invalid_signature'
      };

      const verifyClerkWebhook = vi.fn().mockResolvedValue(false);

      const originalHandler = require('../../infrastructure/clerk-webhook.handler');
      originalHandler.verifyClerkWebhook = verifyClerkWebhook;

      await expect(handleClerkWebhook(mockWebhookPayload, mockHeaders))
        .rejects.toThrow('Unauthorized webhook request');
    });

    it('should handle sync action failure', async () => {
      const mockWebhookPayload = {
        type: 'user.created',
        data: {
          id: 'clerk_user_123',
          email_addresses: [{ email_address: 'test@example.com' }]
        }
      };

      const mockHeaders = {
        'svix-id': 'msg_123',
        'svix-timestamp': new Date().toISOString(),
        'svix-signature': 'mock_signature'
      };

      const verifyClerkWebhook = vi.fn().mockResolvedValue(true);
      const mockSyncAction = vi.fn().mockResolvedValue({
        isError: () => true,
        error: { code: 'USER_NOT_FOUND', message: 'User not found in Clerk' }
      });

      const originalHandler = require('../../infrastructure/clerk-webhook.handler');
      originalHandler.verifyClerkWebhook = verifyClerkWebhook;
      originalHandler.syncClerkUserAction = mockSyncAction;

      await expect(handleClerkWebhook(mockWebhookPayload, mockHeaders))
        .rejects.toThrow('Failed to sync user');
    });
  });
});