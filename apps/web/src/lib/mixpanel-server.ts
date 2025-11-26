/**
 * Mixpanel Server-Side Tracking
 *
 * Server-side analytics tracking using Mixpanel Node SDK
 * Used in Service Layer for tracking business events
 */

import Mixpanel from 'mixpanel';
import { config } from '@/config';

const MIXPANEL_TOKEN = config.analytics.mixpanel;
const IS_PRODUCTION = config.environment === 'production';

// Initialize Mixpanel (singleton)
let mixpanelInstance: Mixpanel.Mixpanel | null = null;

const getMixpanelInstance = (): Mixpanel.Mixpanel | null => {
  if (!MIXPANEL_TOKEN) {
    console.warn('[Mixpanel Server] Token is missing');
    return null;
  }

  if (!mixpanelInstance) {
    mixpanelInstance = Mixpanel.init(MIXPANEL_TOKEN);
  }

  return mixpanelInstance;
};

/**
 * Track Event (Server-Side)
 *
 * @param eventName - Event name
 * @param userId - User ID (optional)
 * @param properties - Event properties
 */
export async function trackEvent(
  eventName: string,
  userId?: string,
  properties?: Record<string, any>
): Promise<void> {
  // Development: Log to console
  if (!IS_PRODUCTION) {
    console.log('[Mixpanel Server Event]', {
      event: eventName,
      distinct_id: userId,
      properties,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Production: Use Mixpanel Node SDK
  const mixpanel = getMixpanelInstance();
  if (!mixpanel) return;

  return new Promise((resolve, reject) => {
    mixpanel.track(
      eventName,
      {
        distinct_id: userId,
        ...properties,
      },
      error => {
        if (error) {
          console.error('[Mixpanel Server] Track error:', error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Set User Properties (Server-Side)
 *
 * @param userId - User ID
 * @param properties - User properties
 */
export async function setUserProperties(
  userId: string,
  properties: Record<string, any>
): Promise<void> {
  // Development: Log to console
  if (!IS_PRODUCTION) {
    console.log('[Mixpanel Server User Properties]', {
      distinct_id: userId,
      properties,
    });
    return;
  }

  // Production: Use Mixpanel Node SDK
  const mixpanel = getMixpanelInstance();
  if (!mixpanel) return;

  return new Promise((resolve, reject) => {
    mixpanel.people.set(userId, properties, error => {
      if (error) {
        console.error('[Mixpanel Server] Set properties error:', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
