import { syncClerkUserAction } from '../actions/user-management.actions';
import { SyncClerkUserCommand } from '../commands';
import { Webhook } from 'svix';

export async function handleClerkWebhook(
  payload: any,
  headers: Record<string, string>
) {
  try {
    // Webhook 검증 (실제 Clerk SDK를 사용한 구현)
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
          metadata: payload.data as Record<string, any>,
          webhookType: payload.type,
        };

        const result = await syncClerkUserAction(command);

        if (!result.success) {
          console.error('Webhook user sync failed:', result.error);
          throw new Error('Failed to sync user');
        }

        console.log('User synced successfully:', result.data);
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

// Clerk webhook verification (실제 Clerk SDK 사용)
async function verifyClerkWebhook(
  payload: any,
  headers: Record<string, string>
): Promise<boolean> {
  try {
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing required webhook headers');
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
}
