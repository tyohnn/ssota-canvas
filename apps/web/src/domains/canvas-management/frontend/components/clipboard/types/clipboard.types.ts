/**
 * Clipboard Types
 *
 * 캔버스 클립보드 붙여넣기 관련 타입 정의
 */

/**
 * 클립보드 콘텐츠 타입
 */
export type ClipboardContentType =
  | 'image-file' // 클립보드의 이미지 파일 (스크린샷, 복사된 이미지)
  | 'image-url' // 이미지 URL (.jpg, .png 등으로 끝나는 URL)
  | 'youtube-url' // YouTube URL
  | 'pdf-url' // PDF URL (.pdf로 끝나는 URL)
  | 'audio-url' // 오디오 URL (.mp3, .wav 등으로 끝나는 URL)
  | 'link-url' // 일반 링크 URL
  | 'rich-text-html' // Rich Text HTML (TipTap에서 복사한 포맷된 텍스트)
  | 'markdown-text' // 마크다운 텍스트 (Tiptap 스타일 감지)
  | 'plain-text' // 일반 텍스트 → MarkdownBlock으로 생성
  | 'unsupported'; // 지원하지 않는 타입

/**
 * 클립보드 분석 결과
 */
export interface ClipboardAnalysisResult {
  /** 감지된 콘텐츠 타입 */
  type: ClipboardContentType;

  /** 타입별 데이터 */
  data: {
    // 이미지 파일
    imageBlob?: Blob;

    // URL 관련
    url?: string;

    // 텍스트 관련
    text?: string;
    html?: string; // Rich Text HTML

    // 메타 정보
    fileName?: string;
    mimeType?: string;
  };

  /** 감지 신뢰도 (0-1) */
  confidence: number;
}

/**
 * 붙여넣기 위치
 */
export interface PastePosition {
  x: number;
  y: number;
}
