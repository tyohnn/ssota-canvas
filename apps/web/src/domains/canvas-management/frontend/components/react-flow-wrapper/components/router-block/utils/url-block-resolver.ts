/**
 * URL Block Resolver
 *
 * Resolves a URL string to the appropriate block type and initial properties.
 * Reuses detection logic patterns from the clipboard analyzer.
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import {
  isImageUrl,
  isPdfUrl,
  isValidUrl,
  isYouTubeUrl,
} from '@/domains/canvas-management/frontend/components/clipboard/utils/clipboard-analyzer';

export interface UrlBlockResolution {
  blockType: BlockType;
  initialProperties: Record<string, unknown>;
}

/**
 * Detect if URL points to an audio file (by extension)
 */
function isAudioUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac', '.flac'];

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return audioExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    const lowerUrl = url.toLowerCase();
    return audioExtensions.some(ext => lowerUrl.split('?')[0]?.endsWith(ext));
  }
}

/**
 * Resolve a URL to block type and initial properties.
 *
 * Resolution order:
 * 1. YouTube URL -> youtube block
 * 2. Image URL -> image block
 * 3. PDF URL -> pdf block
 * 4. Audio URL -> audio block
 * 5. Any other valid URL -> link block
 *
 * @param url - The URL string to resolve
 * @returns Block type and initial properties, or null if not a valid URL
 */
export function resolveUrlToBlockConfig(url: string): UrlBlockResolution | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (!isValidUrl(trimmed)) {
    return null;
  }

  if (isYouTubeUrl(trimmed)) {
    return {
      blockType: BlockType.YOUTUBE,
      initialProperties: { url: trimmed },
    };
  }

  if (isImageUrl(trimmed)) {
    return {
      blockType: BlockType.IMAGE,
      initialProperties: {
        imageUrl: trimmed,
        imageSource: 'user-upload',
        objectFit: 'contain',
      },
    };
  }

  if (isPdfUrl(trimmed)) {
    return {
      blockType: BlockType.PDF,
      initialProperties: { url: trimmed },
    };
  }

  if (isAudioUrl(trimmed)) {
    return {
      blockType: BlockType.AUDIO,
      initialProperties: { audioUrl: trimmed },
    };
  }

  // Generic link (Open Graph link block)
  return {
    blockType: BlockType.LINK,
    initialProperties: { url: trimmed },
  };
}
