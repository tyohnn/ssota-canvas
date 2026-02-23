/**
 * File Block Resolver
 *
 * Resolves a File to the appropriate block type based on MIME type.
 * Initial properties (url, filename, fileSize) are filled after upload.
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';

export interface FileBlockResolution {
  blockType: BlockType;
}

/**
 * Resolve a File to block type based on MIME type.
 *
 * Resolution:
 * - image/* -> image
 * - application/pdf -> pdf
 * - audio/* -> audio
 * - Everything else -> file
 *
 * @param file - The File to resolve
 * @returns Block type for the file
 */
export function resolveFileToBlockConfig(file: File): FileBlockResolution {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('image/')) {
    return { blockType: BlockType.IMAGE };
  }

  if (mimeType === 'application/pdf') {
    return { blockType: BlockType.PDF };
  }

  if (mimeType.startsWith('audio/')) {
    return { blockType: BlockType.AUDIO };
  }

  // Default: generic file block
  return { blockType: BlockType.FILE };
}
