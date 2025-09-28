import { syncClerkUserAction } from '../actions/user-management.actions';
import { SyncClerkUserCommand } from '../commands';

export async function handleClerkWebhook(payload: any, headers: Record<string, string>) {
  try {
    // Webhook 검증 (실제 구현에서는 Clerk의 webhook verification 로직 사용)
    const isValid = await verifyClerkWebhook(payload, headers);
    if (!isValid) {
      throw new Error('Unauthorized webhook request');
    }

    // 이벤트 타입별 처리
    switch (payload.type) {
      case 'user.created':
      case 'user.updated':
      case 'user.deleted':
        const command: SyncClerkUserCommand = {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address || '',
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
          imageUrl: payload.data.image_url,
          status: payload.type === 'user.deleted' ? 'soft_deleted' : 'active',
          metadata: payload.data,
          webhookType: payload.type
        };

        const result = await syncClerkUserAction(command);

        if (result.isError()) {
          console.error('Webhook user sync failed:', result.error);
          throw new Error('Failed to sync user');
        }

        console.log('User synced successfully:', result.value);
        break;

      default:
        console.log('Unhandled webhook type:', payload.type);
    }

    return { success: true };
  } catch (error) {
    console.error('Clerk webhook error:', error);
    throw error;
  }
}

// Clerk webhook verification (실제 구현에서는 Clerk SDK 사용)
async function verifyClerkWebhook(payload: any, headers: Record<string, string>): Promise<boolean> {
  // TODO: Implement proper Clerk webhook verification
  // This should use Clerk's webhook verification utilities
  return true; // Temporary implementation
}