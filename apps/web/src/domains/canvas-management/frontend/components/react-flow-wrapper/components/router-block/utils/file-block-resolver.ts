/**
 * File Block Resolver
 *
 * Resolves a File to the appropriate block type based on MIME type,
 * with fallback to file extension when MIME is missing or generic.
 * Initial properties (url, filename, fileSize) are filled after upload.
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';

export interface FileBlockResolution {
  blockType: BlockType;
}

/**
 * Audio extensions for fallback when MIME is missing/generic.
 * Includes .webm so that our audio-block recordings (audio/webm, often lose MIME on re-upload)
 * are routed to AUDIO, not VIDEO. video/webm is still VIDEO when MIME is present.
 */
const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'wav',
  'ogg',
  'webm',
  'm4a',
  'aac',
  'flac',
  'opus',
]);

/** Video extensions for fallback when MIME is missing/generic (.webm → AUDIO so recordings stay audio) */
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv']);

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

/**
 * Resolve a File to block type based on MIME type (and extension fallback).
 *
 * Resolution:
 * - image/* -> image
 * - application/pdf -> pdf
 * - audio/* -> audio (includes audio/webm)
 * - video/* -> video (includes video/webm)
 * - Extension fallback when MIME is empty/generic: .webm/.mp3 etc. -> audio, .mp4/.mov etc. -> video
 * - Everything else -> file
 *
 * @param file - The File to resolve
 * @returns Block type for the file
 */
export function resolveFileToBlockConfig(file: File): FileBlockResolution {
  const mimeType = file.type.toLowerCase().trim();

  if (mimeType.startsWith('image/')) {
    return { blockType: BlockType.IMAGE };
  }

  if (mimeType === 'application/pdf') {
    return { blockType: BlockType.PDF };
  }

  if (mimeType.startsWith('audio/')) {
    return { blockType: BlockType.AUDIO };
  }

  if (mimeType.startsWith('video/')) {
    return { blockType: BlockType.VIDEO };
  }

  // Fallback: MIME missing or generic — use extension (audio first so recording-*.webm → AUDIO)
  const ext = getFileExtension(file.name);
  if (ext && AUDIO_EXTENSIONS.has(ext)) {
    return { blockType: BlockType.AUDIO };
  }
  if (ext && VIDEO_EXTENSIONS.has(ext)) {
    return { blockType: BlockType.VIDEO };
  }

  // Default: generic file block
  return { blockType: BlockType.FILE };
}
