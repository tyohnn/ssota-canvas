/**
 * Clipboard Analyzer
 *
 * 클립보드 내용을 분석하여 타입 결정
 *
 * 우선순위:
 * 1. 이미지 파일 (image/png, image/jpeg)
 * 2. 텍스트 분석
 *    - YouTube URL
 *    - 이미지 URL (확장자 기반)
 *    - 일반 URL
 *    - 마크다운 (Tiptap 스타일)
 *    - 일반 텍스트
 */

import type {
  ClipboardAnalysisResult,
  ClipboardContentType,
} from '../types/clipboard.types';

/**
 * 클립보드 내용 분석
 */
export async function analyzeClipboard(): Promise<ClipboardAnalysisResult> {
  console.log('[Clipboard Analyzer] Starting analysis...');

  try {
    // 1. 클립보드 아이템 읽기
    console.log('[Clipboard Analyzer] Reading clipboard items...');
    const clipboardItems = await navigator.clipboard.read();
    console.log('[Clipboard Analyzer] Found items:', clipboardItems.length);

    // 2. 이미지 파일 또는 HTML 확인
    for (const item of clipboardItems) {
      console.log('[Clipboard Analyzer] Item types:', item.types);

      // HTML 타입 확인 (TipTap Rich Text)
      if (item.types.includes('text/html')) {
        console.log('[Clipboard Analyzer] HTML content detected');
        try {
          const htmlBlob = await item.getType('text/html');
          const html = await htmlBlob.text();
          console.log(
            '[Clipboard Analyzer] HTML content:',
            html.substring(0, 200)
          );

          // HTML이 있으면 rich-text로 처리
          return {
            type: 'rich-text-html',
            data: {
              html,
            },
            confidence: 1.0,
          };
        } catch (err) {
          console.error('[Clipboard Analyzer] Failed to read HTML:', err);
        }
      }

      // 이미지 타입 우선 순위로 확인 (image/로 시작하는 모든 타입)
      const imageTypes = item.types.filter(type => type.startsWith('image/'));
      console.log('[Clipboard Analyzer] Image types found:', imageTypes);

      if (imageTypes.length > 0) {
        // 첫 번째 이미지 타입 사용
        const imageType = imageTypes[0];
        if (!imageType) continue; // 타입 가드

        console.log('[Clipboard Analyzer] Using image type:', imageType);

        try {
          const blob = await item.getType(imageType);
          console.log('[Clipboard Analyzer] Image blob size:', blob.size);

          return {
            type: 'image-file',
            data: {
              imageBlob: blob,
              mimeType: imageType,
            },
            confidence: 1.0,
          };
        } catch (err) {
          console.error('[Clipboard Analyzer] Failed to get image blob:', err);
          // 계속해서 다음 타입 시도
        }
      }
    }

    // 3. 텍스트 분석
    console.log('[Clipboard Analyzer] No image found, trying text...');
    const text = await navigator.clipboard.readText();
    console.log('[Clipboard Analyzer] Text length:', text?.length || 0);
    console.log('[Clipboard Analyzer] Text preview:', text?.substring(0, 100));

    if (!text || text.trim().length === 0) {
      console.log('[Clipboard Analyzer] No text found, unsupported');
      return {
        type: 'unsupported',
        data: {},
        confidence: 0,
      };
    }

    const trimmedText = text.trim();

    // 3-1. YouTube URL 감지
    console.log('[Clipboard Analyzer] Checking YouTube URL...');
    if (isYouTubeUrl(trimmedText)) {
      console.log('[Clipboard Analyzer] Detected YouTube URL');
      return {
        type: 'youtube-url',
        data: {
          url: trimmedText,
          text: trimmedText,
        },
        confidence: 1.0,
      };
    }

    // 3-2. 이미지 URL 감지
    console.log('[Clipboard Analyzer] Checking image URL...');
    if (isImageUrl(trimmedText)) {
      console.log('[Clipboard Analyzer] Detected image URL');
      return {
        type: 'image-url',
        data: {
          url: trimmedText,
          text: trimmedText,
        },
        confidence: 1.0,
      };
    }

    // 3-3. 일반 URL 감지
    console.log('[Clipboard Analyzer] Checking general URL...');
    if (isValidUrl(trimmedText)) {
      console.log('[Clipboard Analyzer] Detected general URL');
      return {
        type: 'link-url',
        data: {
          url: trimmedText,
          text: trimmedText,
        },
        confidence: 0.9,
      };
    }

    // 3-4. 이미지 파일명 감지 (파일 이름만 복사된 경우)
    console.log('[Clipboard Analyzer] Checking if text is image filename...');
    if (isImageFilename(trimmedText)) {
      console.log(
        '[Clipboard Analyzer] Detected image filename (file not copied, only filename)'
      );
      console.warn(
        '[Clipboard Analyzer] WARNING: Only filename was copied, not the actual image data.'
      );
      console.warn(
        '[Clipboard Analyzer] To copy image: Open the image file and copy the image content (Cmd+A, Cmd+C)'
      );
      return {
        type: 'unsupported',
        data: {
          text: trimmedText,
        },
        confidence: 0,
      };
    }

    // 3-5. 마크다운 문법 감지
    console.log('[Clipboard Analyzer] Checking markdown syntax...');
    if (hasMarkdownSyntax(trimmedText)) {
      console.log('[Clipboard Analyzer] Detected markdown text');
      return {
        type: 'markdown-text',
        data: {
          text: trimmedText,
        },
        confidence: 0.8,
      };
    }

    // 3-6. 일반 텍스트 (기본값)
    console.log('[Clipboard Analyzer] Defaulting to plain text');
    return {
      type: 'plain-text',
      data: {
        text: trimmedText,
      },
      confidence: 0.7,
    };
  } catch (error) {
    console.error('[Clipboard Analyzer] Error analyzing clipboard:', error);
    console.error('[Clipboard Analyzer] Error details:', error);
    return {
      type: 'unsupported',
      data: {},
      confidence: 0,
    };
  }
}

/**
 * YouTube URL 감지
 * - youtube.com/watch?v=
 * - youtu.be/
 * - youtube.com/embed/
 */
export function isYouTubeUrl(url: string): boolean {
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/i,
  ];

  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * 이미지 URL 감지
 * - 확장자 기반: .jpg, .jpeg, .png, .gif, .webp, .svg
 */
export function isImageUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

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

  const lowerUrl = url.toLowerCase();

  // URL의 pathname 부분만 추출하여 확장자 확인
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return imageExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    // URL 파싱 실패 시 단순 문자열 매칭
    return imageExtensions.some(ext => lowerUrl.endsWith(ext));
  }
}

/**
 * 유효한 URL인지 확인
 */
export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 이미지 파일명인지 확인 (파일 이름만 복사된 경우)
 *
 * 이미지 확장자로 끝나고, 경로나 URL이 아닌 순수 파일명인 경우
 */
export function isImageFilename(text: string): boolean {
  // URL이면 파일명이 아님
  if (isValidUrl(text)) {
    return false;
  }

  // 경로가 포함되어 있으면 파일명이 아님 (너무 복잡)
  if (text.includes('/') || text.includes('\\')) {
    return false;
  }

  // 이미지 확장자 목록
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.ico',
    '.tiff',
    '.tif',
  ];

  const lowerText = text.toLowerCase().trim();
  return imageExtensions.some(ext => lowerText.endsWith(ext));
}

/**
 * 마크다운 문법 감지 (Tiptap 스타일)
 *
 * 감지 패턴:
 * - 헤더: # ## ###
 * - 코드블록: ```
 * - 리스트: - * 1.
 * - 볼드/이탤릭: ** * _ __
 * - 링크: [text](url)
 * - 이미지: ![alt](url)
 */
export function hasMarkdownSyntax(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // 헤더 (# ~ ######)
    /```[\s\S]*?```/, // 코드블록
    /^[-*+]\s+.+$/m, // 순서 없는 리스트
    /^\d+\.\s+.+$/m, // 순서 있는 리스트
    /\*\*[^*]+\*\*/, // 볼드 (**)
    /__[^_]+__/, // 볼드 (__)
    /\*[^*]+\*/, // 이탤릭 (*)
    /_[^_]+_/, // 이탤릭 (_)
    /\[.+?\]\(.+?\)/, // 링크
    /!\[.*?\]\(.+?\)/, // 이미지
    /^>\s+.+$/m, // 인용
    /~~[^~]+~~/, // 취소선
    /`[^`]+`/, // 인라인 코드
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
