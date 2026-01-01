// Client-side exports (safe for browser bundle)
export * from './client';
export { MixpanelProvider } from './provider';

// Server-side exports are NOT included here to prevent client bundling
// Import server functions directly: import { trackEvent } from '@/lib/analytics/mixpanel/server';
