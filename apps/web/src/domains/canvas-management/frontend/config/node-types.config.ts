/**
 * Node Types Configuration
 *
 * React Flow의 nodeTypes 정의를 한 곳에서 관리
 * - 실제 Canvas와 Landing Canvas에서 공통으로 사용
 * - 새로운 블록 타입 추가 시 이곳만 수정
 */

'use client';

import dynamic from 'next/dynamic';
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
  ReactComponentBlock,
  VercelDeploymentBlock,
} from '@/domains/block-management/frontend/components/block/block-type';

// PDF Block - Dynamic Import to avoid SSR issues with pdfjs-dist (DOMMatrix)
const PdfBlock = dynamic(
  () =>
    import(
      '@/domains/block-management/frontend/components/block/block-type/pdf'
    ).then(m => ({ default: m.PdfBlock })),
  { ssr: false }
);

/**
 * React Flow Node Types
 *
 * 모든 블록 타입을 React Flow 노드로 등록
 * (PDF 블록은 SSR 이슈로 dynamic import 처리)
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
  [BlockType.REACT_COMPONENT]: ReactComponentBlock,
  [BlockType.VERCEL_DEPLOYMENT]: VercelDeploymentBlock,
  [BlockType.PDF]: PdfBlock,
  // GITHUB_PR 등은 추후 구현
};
