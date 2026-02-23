/**
 * Clipboard Block Creator
 *
 * 클립보드 분석 결과를 바탕으로 블록 생성
 *
 * 각 타입별로 적절한 블록을 생성하고 캔버스에 배치
 */
import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type {
  ClipboardAnalysisResult,
  PastePosition,
} from '../types/clipboard.types';

export interface CreateBlockContext {
  pageId: string;
}

/**
 * 클립보드 분석 결과를 바탕으로 블록 생성
 *
 * @param analysisResult 클립보드 분석 결과
 * @param position 블록 배치 위치
 * @param context 블록 생성 컨텍스트
 * @param createAndMountBlock 블록 생성 함수 (useCanvasBlockLifecycle에서 제공)
 * @param uploadImageToSupabase 이미지 업로드 함수
 * @returns 생성된 블록 타입 또는 null
 */
export async function createBlockFromClipboard(
  analysisResult: ClipboardAnalysisResult,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>,
  uploadImageToSupabase?: (blob: Blob, fileName: string) => Promise<string>
): Promise<BlockType | null> {
  const { type, data } = analysisResult;

  switch (type) {
    case 'image-file':
      return await createImageBlockFromFile(
        data.imageBlob!,
        position,
        context,
        createAndMountBlock,
        uploadImageToSupabase
      );

    case 'image-url':
      return await createImageBlockFromUrl(
        data.url!,
        position,
        context,
        createAndMountBlock
      );

    case 'youtube-url':
      return await createYoutubeBlock(
        data.url!,
        position,
        context,
        createAndMountBlock
      );

    case 'pdf-url':
      return await createPdfBlock(
        data.url!,
        position,
        context,
        createAndMountBlock
      );

    case 'link-url':
      return await createLinkBlock(
        data.url!,
        position,
        context,
        createAndMountBlock
      );

    case 'markdown-text':
    case 'plain-text':
      return await createMarkdownBlock(
        data.text!,
        position,
        context,
        createAndMountBlock
      );

    case 'unsupported':
    default:
      console.warn('[Clipboard] Unsupported clipboard content type:', type);
      return null;
  }
}

/**
 * 이미지 블록 생성 (파일)
 *
 * 1. Supabase Storage 업로드
 * 2. ImageBlock 생성
 */
async function createImageBlockFromFile(
  blob: Blob,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>,
  uploadImageToSupabase?: (blob: Blob, fileName: string) => Promise<string>
): Promise<BlockType | null> {
  try {
    // 이미지 업로드 함수가 제공되지 않은 경우
    if (!uploadImageToSupabase) {
      console.error(
        '[Clipboard] Image upload function not provided. Cannot create image block from file.'
      );
      return null;
    }

    // 파일명 생성 (timestamp + random)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const extension = blob.type.split('/')[1] || 'png';
    const fileName = `clipboard-${timestamp}-${randomId}.${extension}`;

    console.log('[Clipboard] Uploading image to Supabase...', {
      fileName,
      size: blob.size,
      type: blob.type,
    });

    // Supabase Storage에 업로드
    const imageUrl = await uploadImageToSupabase(blob, fileName);

    console.log('[Clipboard] Image uploaded successfully:', imageUrl);

    // 이미지 블록 생성
    await createAndMountBlock(BlockType.IMAGE, position);

    // Note: 업로드된 imageUrl은 블록 생성 후 properties로 별도 업데이트 필요
    // 이는 use-clipboard-paste 훅에서 처리

    return BlockType.IMAGE;
  } catch (error) {
    console.error('[Clipboard] Failed to create image block from file:', error);
    return null;
  }
}

/**
 * 이미지 블록 생성 (URL)
 *
 * ImageBlock 생성 (URL 직접 사용)
 */
async function createImageBlockFromUrl(
  url: string,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>
): Promise<BlockType | null> {
  try {
    console.log('[Clipboard] Creating image block from URL:', url);

    // 이미지 블록 생성
    await createAndMountBlock(BlockType.IMAGE, position);

    // Note: imageUrl은 블록 생성 후 properties로 별도 업데이트 필요
    // 이는 use-clipboard-paste 훅에서 처리

    return BlockType.IMAGE;
  } catch (error) {
    console.error('[Clipboard] Failed to create image block from URL:', error);
    return null;
  }
}

/**
 * YouTube 블록 생성
 */
async function createYoutubeBlock(
  url: string,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>
): Promise<BlockType | null> {
  try {
    console.log('[Clipboard] Creating YouTube block:', url);

    // YouTube 블록 생성
    await createAndMountBlock(BlockType.YOUTUBE, position);

    // Note: videoUrl은 블록 생성 후 properties로 별도 업데이트 필요
    // 이는 use-clipboard-paste 훅에서 처리

    return BlockType.YOUTUBE;
  } catch (error) {
    console.error('[Clipboard] Failed to create YouTube block:', error);
    return null;
  }
}

/**
 * PDF 블록 생성
 */
async function createPdfBlock(
  url: string,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>
): Promise<BlockType | null> {
  try {
    console.log('[Clipboard] Creating PDF block:', url);
    await createAndMountBlock(BlockType.PDF, position);
    return BlockType.PDF;
  } catch (error) {
    console.error('[Clipboard] Failed to create PDF block:', error);
    return null;
  }
}

/**
 * 링크 블록 생성
 *
 * URL 메타데이터 fetch (제목, 설명, 썸네일)
 */
async function createLinkBlock(
  url: string,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>
): Promise<BlockType | null> {
  try {
    console.log('[Clipboard] Creating link block:', url);

    // 링크 블록 생성
    await createAndMountBlock(BlockType.LINK, position);

    // Note: linkUrl은 블록 생성 후 properties로 별도 업데이트 필요
    // 이는 use-clipboard-paste 훅에서 처리

    return BlockType.LINK;
  } catch (error) {
    console.error('[Clipboard] Failed to create link block:', error);
    return null;
  }
}

/**
 * 마크다운 블록 생성
 *
 * 일반 텍스트도 여기서 처리 (마크다운으로 변환)
 */
async function createMarkdownBlock(
  text: string,
  position: PastePosition,
  context: CreateBlockContext,
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition
  ) => Promise<void>
): Promise<BlockType | null> {
  try {
    console.log('[Clipboard] Creating markdown block with text:', {
      preview: text.substring(0, 100),
      length: text.length,
    });

    // 마크다운 블록 생성
    await createAndMountBlock(BlockType.MARKDOWN, position);

    // Note: content는 블록 생성 후 별도 업데이트 필요
    // 이는 use-clipboard-paste 훅에서 처리

    return BlockType.MARKDOWN;
  } catch (error) {
    console.error('[Clipboard] Failed to create markdown block:', error);
    return null;
  }
}
