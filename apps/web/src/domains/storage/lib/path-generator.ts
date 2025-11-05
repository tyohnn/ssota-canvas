/**
 * Path Generator
 *
 * Supabase Storage path 생성 로직
 */

import { AssetCategory, PathOptions } from '../types/storage.types';

export function generateAssetPath(options: PathOptions): string {
  const { orgId, workspaceId, pageId, blockId, file } = options;

  // Extract extension
  const ext = getFileExtension(file.name);

  // Generate UUID
  const uuid = crypto.randomUUID();

  // Timestamp
  const timestamp = Date.now();

  // Determine category
  const category = getCategoryFromMimeType(file.type);

  // Build path: {category}/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
  return `${category}/${orgId}/${workspaceId}/${pageId}/${blockId}/${timestamp}-${uuid}.${ext}`;
}

export function getCategoryFromMimeType(mimeType: string): AssetCategory {
  if (mimeType.startsWith('image/')) return AssetCategory.IMAGES;
  if (mimeType.startsWith('video/')) return AssetCategory.VIDEOS;
  if (mimeType.startsWith('application/pdf')) return AssetCategory.DOCUMENTS;
  if (
    mimeType.includes('code') ||
    mimeType.includes('text') ||
    mimeType.startsWith('application/json')
  ) {
    return AssetCategory.CODE;
  }
  return AssetCategory.DOCUMENTS;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);
}
