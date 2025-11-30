/**
 * 이미지 업로드 및 DB 저장 헬퍼
 *
 * 의존성:
 * - storage: generateImageAssetPath, Supabase Client
 * - image-app-space: createImageAssetAction
 */

import { createClient } from '@/utils/supabase/browser';
import { generateImageAssetPath } from '@/domains/storage/lib/path-generator';
import { createImageAssetAction } from '../../actions/image-asset.actions';
import { getImageUrlAction } from '../../actions/image-asset.actions';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

/**
 * 이미지 업로드 및 DB 저장
 *
 * @param file - 업로드할 파일
 * @param workspaceId - 워크스페이스 ID
 * @returns 생성된 ImageAsset
 */
export async function uploadImageAsset(
  file: File,
  workspaceId: string
): Promise<ImageAsset> {
  const supabase = createClient();

  // 1. Storage 경로 생성 (워크스페이스 중심)
  const path = generateImageAssetPath(workspaceId, file.name);

  // 2. Storage 업로드
  console.log('[uploadImageAsset] Uploading to storage:', {
    bucket: 'image-assets',
    path,
    fileSize: file.size,
  });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('image-assets')
    .upload(path, file);

  if (uploadError) {
    console.error('[uploadImageAsset] Storage upload error:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  console.log('[uploadImageAsset] Storage upload successful:', uploadData);

  // 3. 이미지 메타데이터 추출
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  // 4. DB 저장 (storage path로 먼저 생성)
  console.log('[uploadImageAsset] Saving to image_assets table:', {
    assetType: 'user-upload',
    imageUrl: path,
    workspaceId,
    width: img.naturalWidth,
    height: img.naturalHeight,
  });

  const result = await createImageAssetAction({
    assetType: 'user-upload',
    imageUrl: path, // Storage path (임시)
    workspaceId,
    width: img.naturalWidth,
    height: img.naturalHeight,
    fileSize: file.size,
    mimeType: file.type,
  });

  if (!result.success) {
    console.error('[uploadImageAsset] DB save error:', result.error);
    throw new Error(`Failed to save image metadata: ${result.error}`);
  }

  console.log(
    '[uploadImageAsset] Successfully saved to image_assets:',
    result.data.id
  );

  // 5. ✅ Signed URL 생성하여 imageUrl 업데이트
  try {
    const urlResult = await getImageUrlAction({ imageAssetId: result.data.id });
    if (urlResult.success) {
      console.log(
        '[uploadImageAsset] Generated signed URL:',
        urlResult.data.url
      );
      // imageUrl을 signed URL로 업데이트하여 반환
      return {
        ...result.data,
        image_url: urlResult.data.url,
      };
    }
  } catch (error) {
    console.warn(
      '[uploadImageAsset] Failed to generate signed URL, using storage path:',
      error
    );
  }

  return result.data;
}
