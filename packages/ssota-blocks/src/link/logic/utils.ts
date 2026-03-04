/**
 * Link Block Utilities
 */

import type { LinkMetadata } from './types';

export function getDomain(urlString: string): string {
  try {
    const urlObj = new URL(urlString);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function buildFallbackMetadata(
  domainValue: string,
  urlString: string
): LinkMetadata {
  return {
    title: domainValue || 'Invalid URL',
    description: urlString,
    imageUrl: '',
    siteName: domainValue,
    domain: domainValue,
    faviconUrl: `https://icons.duckduckgo.com/ip3/${domainValue}.ico`,
    type: 'website',
  };
}

export const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;
