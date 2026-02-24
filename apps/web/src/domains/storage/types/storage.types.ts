/**
 * Storage Types
 *
 * Supabase Storage 관련 타입 정의
 */

export enum StorageBucket {
  USER_AVATARS = 'user-avatars',
  CANVAS_ASSETS = 'canvas-assets',
  IMAGE_ASSETS = 'image-assets', // Workspace-centric image storage
  THUMBNAILS = 'thumbnails',
  EXPORTS = 'exports',
}

export enum AssetCategory {
  IMAGES = 'images',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
  CODE = 'code',
}

export interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  path?: string; // Optional: auto-generated if not provided
  onProgress?: (progress: number) => void;
  compress?: boolean; // For images
  // Context for canvas-assets path: orgId/workspaceId/{blockId|pageId}/
  blockId?: string;
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface UploadResult {
  url: string; // Signed URL (private) or Public URL
  path: string; // Full path in storage
  publicUrl?: string; // Only for public buckets
  size: number;
  mimeType: string;
  width?: number; // For images
  height?: number; // For images
}

export interface PathOptions {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string;
  file: File;
}

export interface StorageError {
  code: string;
  message: string;
  details?: any;
}
