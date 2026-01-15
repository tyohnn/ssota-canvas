/**
 * Block Types and Sizes Configuration
 *
 * 데이터베이스 스키마(schema-dev.ts)를 SSOT로 사용하여 타입 추출
 * - 데이터베이스 스키마가 단일 진실 공급원 (Single Source of Truth)
 * - 여기서는 데이터베이스에서 추출한 타입을 사용
 */
import { blockTypeEnum } from '@/db/schema';

/**
 * 데이터베이스 스키마에서 추출한 블록 타입 (SSOT)
 *
 * 데이터베이스 스키마가 단일 진실 공급원이므로,
 * 여기서는 데이터베이스 enum을 그대로 사용
 */
export type BlockType = (typeof blockTypeEnum.enumValues)[number];

/**
 * 블록 타입 상수 (데이터베이스 스키마 기반)
 */
export const BlockType = {
  TEXT: 'text' as const,
  SHAPE: 'shape' as const,
  MARKDOWN: 'markdown' as const,
  YOUTUBE: 'youtube' as const,
  IMAGE: 'image' as const,
  PDF: 'pdf' as const,
  AUDIO: 'audio' as const,
  VIDEO: 'video' as const,
  FILE: 'file' as const,
  PYTHON: 'python' as const,
  LINK: 'link' as const,
  PAGE_MENTION: 'page_mention' as const,
  LATEX: 'latex' as const,
  REACT_COMPONENT: 'react_component' as const,
  GITHUB_BRANCH: 'github_branch' as const,
  GITHUB_COMMIT: 'github_commit' as const,
  GITHUB_PR: 'github_pr' as const,
  REACT_PREVIEW: 'react_preview' as const,
  VERCEL_DEPLOYMENT: 'vercel_deployment' as const,
} as const;

/**
 * 블록 타입별 기본 크기 정의 (데이터베이스 스키마 기반)
 */
export const BLOCK_TYPE_SIZES: Record<
  BlockType,
  { width: number; height: number }
> = {
  [BlockType.TEXT]: { width: 200, height: 100 }, // 텍스트 블록
  [BlockType.SHAPE]: { width: 154, height: 70 }, // 도형 블록
  [BlockType.MARKDOWN]: { width: 342, height: 456 }, // 마크다운 블록 (3:4 비율)
  [BlockType.YOUTUBE]: { width: 410, height: 288 }, // YouTube iframe (222px) + 하단 정보 섹션
  [BlockType.IMAGE]: { width: 300, height: 200 },
  [BlockType.PDF]: { width: 300, height: 400 }, // PDF 문서
  [BlockType.AUDIO]: { width: 300, height: 120 }, // 오디오 플레이어
  [BlockType.VIDEO]: { width: 400, height: 225 }, // 비디오 플레이어
  [BlockType.FILE]: { width: 250, height: 150 },
  [BlockType.PYTHON]: { width: 350, height: 250 },
  [BlockType.LINK]: { width: 316, height: 288 }, // 링크 블록 (16:9 비율에 가까운 크기)
  [BlockType.PAGE_MENTION]: { width: 250, height: 120 },
  [BlockType.LATEX]: { width: 300, height: 180 },
  [BlockType.GITHUB_PR]: { width: 400, height: 200 },
  [BlockType.REACT_COMPONENT]: { width: 350, height: 250 },
  [BlockType.GITHUB_BRANCH]: { width: 320, height: 180 }, // GitHub 브랜치 블록
  [BlockType.GITHUB_COMMIT]: { width: 320, height: 160 }, // GitHub 커밋 블록
  [BlockType.REACT_PREVIEW]: { width: 500, height: 400 }, // React 프리뷰 블록
  [BlockType.VERCEL_DEPLOYMENT]: { width: 350, height: 200 }, // Vercel 배포 블록
} as const;

/**
 * 뷰 모드별 기본 크기 정의
 * - original: 블록 타입별 BLOCK_TYPE_SIZES 사용
 * - card, note: 범용 기본 크기 사용
 */
export const VIEW_MODE_DEFAULT_SIZES = {
  card: { width: 300, height: 200 }, // 카드 뷰 범용 기본 크기
  note: { width: 400, height: 300 }, // 노트 뷰 범용 기본 크기
} as const;

/**
 * 블록 타입별 기본 크기 가져오기
 * @param blockType - 블록 타입
 * @returns 블록 크기 정보
 */
export function getBlockSize(blockType: BlockType): {
  width: number;
  height: number;
} {
  const size = BLOCK_TYPE_SIZES[blockType as BlockType];
  return size || { width: 200, height: 150 };
}

/**
 * 뷰 모드와 블록 타입에 따른 기본 크기 가져오기
 * @param blockType - 블록 타입
 * @param viewMode - 뷰 모드
 * @returns 블록 크기 정보
 */
export function getBlockSizeForViewMode(
  blockType: BlockType,
  viewMode: 'original' | 'card' | 'note'
): { width: number; height: number } {
  if (viewMode === 'original') {
    return getBlockSize(blockType);
  }
  return VIEW_MODE_DEFAULT_SIZES[viewMode];
}

/**
 * 블록 타입 검증 (데이터베이스 스키마 기반)
 * @param blockType - 검증할 블록 타입
 * @returns 유효한 블록 타입인지 여부
 */
export function isValidBlockType(blockType: string): blockType is BlockType {
  return blockTypeEnum.enumValues.includes(blockType as BlockType);
}
