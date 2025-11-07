/**
 * File Validation
 *
 * 파일 검증 로직
 */

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/flac',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다.`
    );
  }

  // Check image size
  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `이미지 크기가 ${MAX_IMAGE_SIZE / 1024 / 1024}MB를 초과합니다.`
    );
  }

  // Check audio size
  if (file.type.startsWith('audio/') && file.size > MAX_AUDIO_SIZE) {
    throw new Error(
      `오디오 크기가 ${MAX_AUDIO_SIZE / 1024 / 1024}MB를 초과합니다.`
    );
  }

  // Check MIME type
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_AUDIO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`);
  }
}

export function isImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function isVideo(file: File): boolean {
  return ALLOWED_VIDEO_TYPES.includes(file.type);
}

export function isAudio(file: File): boolean {
  return ALLOWED_AUDIO_TYPES.includes(file.type);
}

export function isDocument(file: File): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}
