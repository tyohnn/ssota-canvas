/**
 * Node Types Configuration
 *
 * React Flow의 nodeTypes 정의를 한 곳에서 관리
 * - 실제 Canvas와 Landing Canvas에서 공통으로 사용
 * - 새로운 블록 타입 추가 시 이곳만 수정
 */

import type { NodeTypes } from '@xyflow/react';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

// Block components
import {
  MarkdownBlock,
  YoutubeBlock,
  PythonBlock,
  TextBlock,
  ShapeBlock,
  ImageBlock,
  LinkBlock,
  AudioBlock,
  GitHubBranchBlock,
  GitHubCommitBlock,
  ReactPreviewBlock,
  VercelDeploymentBlock,
} from '@/domains/block-management/frontend/components/block/block-type';

/**
 * React Flow Node Types
 *
 * 모든 블록 타입을 React Flow 노드로 등록
 * (PDF 블록은 SSR 이슈로 별도 처리 필요)
 */
export const CANVAS_NODE_TYPES: NodeTypes = {
  [BlockType.TEXT]: TextBlock,
  [BlockType.SHAPE]: ShapeBlock,
  [BlockType.IMAGE]: ImageBlock,
  [BlockType.MARKDOWN]: MarkdownBlock,
  [BlockType.YOUTUBE]: YoutubeBlock,
  [BlockType.PYTHON]: PythonBlock,
  [BlockType.LINK]: LinkBlock,
  [BlockType.AUDIO]: AudioBlock,
  [BlockType.GITHUB_BRANCH]: GitHubBranchBlock,
  [BlockType.GITHUB_COMMIT]: GitHubCommitBlock,
  [BlockType.REACT_PREVIEW]: ReactPreviewBlock,
  [BlockType.VERCEL_DEPLOYMENT]: VercelDeploymentBlock,
  // PDF는 dynamic import 필요
  // GITHUB_PR, REACT_COMPONENT 등은 추후 구현
};

/**
 * Node Types with PDF (Dynamic Import 필요)
 *
 * PDF 블록을 사용해야 하는 경우 별도로 추가 필요
 * 사용 예시:
 *
 * ```tsx
 * const PdfBlock = dynamic(() => import('...').then(m => ({ default: m.PdfBlock })), { ssr: false });
 * const nodeTypes = { ...CANVAS_NODE_TYPES, [BlockType.PDF]: PdfBlock };
 * ```
 */
