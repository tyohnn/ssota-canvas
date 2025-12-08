/**
 * Image File Utilities
 *
 * 이미지 파일 처리를 위한 순수 유틸리티 함수들
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 도메인 독립적
 * - 여러 곳에서 재사용 가능
 */

/**
 * 파일을 Base64로 변환
 *
 * @param file - 변환할 파일
 * @returns Base64 인코딩된 문자열 (data URL 포함)
 *
 * @example
 * const base64 = await fileToBase64(file);
 * // "data:image/png;base64,iVBORw0KGgo..."
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 메타데이터 추출 (width, height)
 *
 * @param file - 이미지 파일
 * @returns 이미지 크기 정보
 *
 * @example
 * const { width, height } = await extractImageMetadata(file);
 * // { width: 1920, height: 1080 }
 */
export async function extractImageMetadata(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 *
 * @param bytes - 파일 크기 (bytes)
 * @returns 포맷된 문자열
 *
 * @example
 * formatFileSize(1024);      // "1 KB"
 * formatFileSize(1048576);   // "1 MB"
 * formatFileSize(1536);      // "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 이미지 파일 검증
 *
 * @param file - 검증할 파일
 * @param maxSizeMB - 최대 크기 (MB)
 * @returns 검증 결과 (에러 메시지 또는 null)
 *
 * @example
 * const error = validateImageFile(file, 10);
 * if (error) {
 *   console.error(error);
 * }
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): string | null {
  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }

  // 지원되는 형식 검증
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP';
  }

  // 파일 크기 검증
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return `Image size must be less than ${maxSizeMB}MB`;
  }

  return null;
}

/**
 * 이미지 종횡비에 맞춘 블록 크기 계산
 *
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 * @param currentHeight - 현재 블록 높이 (옵셔널, 있으면 높이 기준으로 너비 계산)
 * @returns 블록 크기 (width, height)
 *
 * @example
 * const { width, height } = calculateBlockSizeFromImage(1920, 1080);
 * // { width: 300, height: 169 }
 *
 * const { width, height } = calculateBlockSizeFromImage(1920, 1080, 200);
 * // { width: 356, height: 200 } (높이 200 기준으로 너비 계산)
 */
export function calculateBlockSizeFromImage(
  imageWidth: number,
  imageHeight: number,
  currentHeight?: number
): { width: number; height: number } {
  const MIN_BLOCK_WIDTH = 100;
  const MIN_BLOCK_HEIGHT = 50;

  const aspectRatio = imageWidth / imageHeight;

  let blockWidth: number;
  let blockHeight: number;

  if (currentHeight !== undefined && currentHeight > 0) {
    // 현재 높이를 기준으로 너비 계산
    blockHeight = Math.max(MIN_BLOCK_HEIGHT, currentHeight);
    blockWidth = Math.round(blockHeight * aspectRatio);
    blockWidth = Math.max(MIN_BLOCK_WIDTH, blockWidth);
  } else {
    // 기본 너비 사용, 종횡비에 맞춰 높이 계산
    const DEFAULT_IMAGE_BLOCK_WIDTH = 300;
    blockWidth = DEFAULT_IMAGE_BLOCK_WIDTH;

    // 매우 넓은 이미지 (16:9 이상)는 조금 더 넓게
    if (aspectRatio > 1.5) {
      blockWidth = 400;
    }

    blockHeight = Math.round(blockWidth / aspectRatio);
    blockWidth = Math.max(MIN_BLOCK_WIDTH, blockWidth);
    blockHeight = Math.max(MIN_BLOCK_HEIGHT, blockHeight);
  }

  return {
    width: blockWidth,
    height: blockHeight,
  };
}
