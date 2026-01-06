/**
 * Canvas Clipboard Paste Hook
 *
 * 캔버스 클립보드 붙여넣기 훅
 *
 * - Cmd/Ctrl + V 감지
 * - 클립보드 분석
 * - 블록 생성
 * - 캔버스 중앙에 배치
 */

'use client';

import { useCallback, useState } from 'react';

import { generateJSON } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useReactFlow } from '@xyflow/react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import type { PastePosition } from '../types/clipboard.types';
import { analyzeClipboard } from '../utils/clipboard-analyzer';

export interface UseClipboardPasteProps {
  pageId: string;
  createAndMountBlock: (
    blockType: BlockType,
    position: PastePosition,
    initialProperties?: Record<string, any>, // 선택적 초기 properties
    initialContent?: unknown // 선택적 초기 content (JSONB)
  ) => Promise<void>;
}

export interface UseClipboardPasteReturn {
  /** 붙여넣기 핸들러 (Cmd+V) */
  handlePaste: () => Promise<void>;

  /** 상태 */
  isPasting: boolean;
  error: string | null;
}

/**
 * 캔버스 클립보드 붙여넣기 훅
 */
export function useClipboardPaste({
  pageId,
  createAndMountBlock,
}: UseClipboardPasteProps): UseClipboardPasteReturn {
  const reactFlowInstance = useReactFlow();
  const [isPasting, setIsPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase Storage 훅
  const { upload } = useSupabaseStorage();

  /**
   * 캔버스 중앙 좌표 계산
   */
  const getCanvasCenterPosition = useCallback((): PastePosition => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    return {
      x: (canvasWidth / 2 - x) / zoom,
      y: (canvasHeight / 2 - y) / zoom,
    };
  }, [reactFlowInstance]);

  /**
   * Supabase Storage 이미지 업로드
   * Blob을 File로 변환하여 업로드
   */
  const uploadImageToSupabase = useCallback(
    async (blob: Blob, fileName: string): Promise<string> => {
      try {
        console.log('[Clipboard] Uploading image to Supabase Storage...', {
          fileName,
          size: blob.size,
          type: blob.type,
        });

        // Blob을 File로 변환
        const file = new File([blob], fileName, { type: blob.type });

        // Supabase Storage에 업로드 (temp 폴더 사용)
        const result = await upload({
          bucket: StorageBucket.CANVAS_ASSETS,
          file,
          // Context가 없으므로 temp 폴더에 저장 (자동 처리됨)
        });

        console.log('[Clipboard] Image uploaded successfully:', result.url);
        return result.url;
      } catch (uploadError) {
        console.error('[Clipboard] Supabase upload failed:', uploadError);
        // Fallback: Blob URL 사용 (임시)
        const blobUrl = URL.createObjectURL(blob);
        console.warn(
          '[Clipboard] Using temporary Blob URL as fallback:',
          blobUrl
        );
        return blobUrl;
      }
    },
    [upload]
  );

  /**
   * 붙여넣기 핸들러
   */
  const handlePaste = useCallback(async () => {
    console.log('[Clipboard] handlePaste called');

    // 이미 붙여넣기 진행 중이면 무시
    if (isPasting) {
      console.log('[Clipboard] Already pasting, skipping...');
      return;
    }

    setIsPasting(true);
    setError(null);

    try {
      console.log('[Clipboard] Paste triggered - starting analysis...');

      // 클립보드 권한 확인
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'clipboard-read' as PermissionName,
        });
        console.log('[Clipboard] Permission status:', permissionStatus.state);
      } catch (err) {
        console.log('[Clipboard] Permission check not supported:', err);
      }

      // 1. 클립보드 분석
      const analysisResult = await analyzeClipboard();

      console.log('[Clipboard] Analysis result:', analysisResult);

      if (analysisResult.type === 'unsupported') {
        // 이미지 파일명인 경우 특별한 메시지
        const text = analysisResult.data.text || '';
        const imageExtensions = [
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.ico',
        ];
        const isImageFilename = imageExtensions.some(ext =>
          text.toLowerCase().endsWith(ext)
        );

        if (isImageFilename) {
          setError(
            '이미지 파일명만 복사되었습니다. 이미지 파일을 열어서 내용을 복사하거나(Cmd+A, Cmd+C), 드래그앤드롭으로 추가해주세요.'
          );
          console.warn(
            '[Clipboard] Image filename detected, but no image data'
          );
        } else {
          setError('지원하지 않는 클립보드 내용입니다.');
        }
        return;
      }

      // 2. 캔버스 중앙 좌표 계산
      const position = getCanvasCenterPosition();

      console.log('[Clipboard] Paste position (canvas center):', position);

      // 4. 블록 타입별 initialProperties, initialContent 준비
      let blockType: BlockType;
      let initialProperties: Record<string, any> | undefined = undefined;
      let initialContent: unknown = undefined;

      switch (analysisResult.type) {
        case 'image-file': {
          // 이미지 파일 업로드
          const blob = analysisResult.data.imageBlob!;
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 9);
          const extension = blob.type.split('/')[1] || 'png';
          const fileName = `clipboard-${timestamp}-${randomId}.${extension}`;

          const imageUrl = await uploadImageToSupabase(blob, fileName);

          blockType = BlockType.IMAGE;
          initialProperties = {
            imageUrl,
            imageSource: 'user-upload',
            objectFit: 'contain',
          };
          break;
        }

        case 'image-url': {
          blockType = BlockType.IMAGE;
          initialProperties = {
            imageUrl: analysisResult.data.url,
            imageSource: 'user-upload',
            objectFit: 'contain',
          };
          break;
        }

        case 'youtube-url': {
          blockType = BlockType.YOUTUBE;
          initialProperties = {
            url: analysisResult.data.url, // ✅ videoUrl이 아니라 url
          };
          break;
        }

        case 'link-url': {
          blockType = BlockType.LINK;
          initialProperties = {
            url: analysisResult.data.url, // ✅ linkUrl이 아니라 url
          };
          break;
        }

        case 'rich-text-html': {
          blockType = BlockType.MARKDOWN;
          // ✨ HTML을 TipTap JSON으로 변환
          const html = analysisResult.data.html || '';
          console.log(
            '[Clipboard] Rich text HTML detected, length:',
            html.length
          );

          try {
            // TipTap의 generateJSON으로 HTML → JSON 변환
            const tiptapJson = generateJSON(html, [StarterKit]);
            console.log(
              '[Clipboard] Converted HTML to TipTap JSON:',
              tiptapJson
            );
            initialContent = tiptapJson;
          } catch (err) {
            console.error('[Clipboard] Failed to parse HTML:', err);
            // Fallback: plain text로 처리
            initialContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: html }],
                },
              ],
            };
          }
          break;
        }

        case 'markdown-text':
        case 'plain-text': {
          blockType = BlockType.MARKDOWN;
          // ✨ content를 TipTap JSON 형식으로 변환하여 전달
          // TipTap은 단순 텍스트를 자동으로 파싱하지만, JSON 형식이 더 안전함
          const text = analysisResult.data.text || '';
          initialContent = {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: text
                  ? [
                      {
                        type: 'text',
                        text: text,
                      },
                    ]
                  : [],
              },
            ],
          };
          break;
        }

        default: {
          setError('지원하지 않는 클립보드 타입입니다.');
          return;
        }
      }

      // 5. 블록 생성 (initialProperties, initialContent 포함)
      console.log('[Clipboard] Creating block with initial data:', {
        blockType,
        initialProperties,
        initialContent: initialContent ? '(content provided)' : undefined,
      });

      await createAndMountBlock(
        blockType,
        position,
        initialProperties,
        initialContent // ✨ initialContent 전달
      );

      console.log('[Clipboard] Block created successfully:', blockType);
    } catch (err) {
      console.error('[Clipboard] Paste error:', err);
      setError(
        err instanceof Error ? err.message : '붙여넣기 중 오류가 발생했습니다.'
      );
    } finally {
      setIsPasting(false);
    }
  }, [
    isPasting,
    getCanvasCenterPosition,
    pageId,
    createAndMountBlock,
    uploadImageToSupabase,
    reactFlowInstance,
    upload,
  ]);

  return {
    handlePaste,
    isPasting,
    error,
  };
}
