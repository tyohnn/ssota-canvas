/**
 * Block Type Definitions
 *
 * 각 블럭 타입의 상세한 정보를 정의합니다.
 * - 설명 및 사용 시나리오
 * - Basic Properties 스키마
 * - 사용 가능한 Actions
 *
 * 구조:
 * - 각 블럭 타입 폴더에서 AI definition을 정의
 * - 이 파일에서는 단순히 병합하여 export
 */
import { z } from 'zod';

import { audioAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/audio/config/audio-ai-definition';
import { imageAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/image/config/image-ai-definition';
import { linkAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/link/config/link-ai-definition';
// Import block type definitions from each block type folder
import { markdownAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/markdown/config/markdown-ai-definition';
import { pdfAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/pdf/config/pdf-ai-definition';
import { pythonAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/python/config/python-ai-definition';
import { shapeAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/shape/config/shape-ai-definition';
import { textAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/text/config/text-ai-definition';
import { youtubeAIDefinition } from '@/domains/block-management/frontend/components/block/block-type/youtube/config/youtube-ai-definition';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

/**
 * Property Schema for AI Agent
 * AI가 블럭 생성/수정 시 참고할 속성 스키마
 */
export interface PropertySchemaForAgent {
  type: PropertyType | 'enum'; // PropertyType enum + 'enum' for ColorToken, FontSize, etc.
  description: string;
  default?: any;
  options?: readonly any[]; // for enum type (enum values)
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Action Definition for AI Agent
 * AI가 executeBlockAction 호출 시 참고할 액션 정의
 *
 * Note: paramsSchema는 action-schemas-registry.ts에서 관리
 * 여기는 AI에게 설명하는 문서 역할만
 */
export interface ActionDefinitionForAgent {
  name: string;
  description: string;
  params?: Record<string, PropertySchemaForAgent>;
}

/**
 * Block Type Definition for AI Agent
 * AI가 블럭 타입 이해 시 참고할 전체 정의
 */
export interface BlockTypeDefinition {
  type: string;
  name: string;
  description: string;
  useCases: string[];
  basicProperties: Record<string, PropertySchemaForAgent>;
  actions: ActionDefinitionForAgent[];
  examples: string[];
}

/**
 * 전체 블럭 타입 리스트 (시스템 프롬프트용)
 */
export const ALL_BLOCK_TYPES = [
  'text',
  'shape',
  'image',
  'markdown',
  'link',
  'youtube',
  'pdf',
  'audio',
  'video',
  'file',
  'python',
  'page_mention',
  'latex',
  'github_pr',
  'react_component',
] as const;

/**
 * 블럭 타입 상세 정의
 *
 * 각 블럭 타입 폴더에서 정의를 import하여 병합
 * 이렇게 하면 블럭 구현과 AI 정의가 함께 관리됨
 */
export const BLOCK_TYPE_DEFINITIONS: Record<string, BlockTypeDefinition> = {
  // Definitions from block type folders
  markdown: markdownAIDefinition,
  text: textAIDefinition,
  shape: shapeAIDefinition,
  image: imageAIDefinition,
  youtube: youtubeAIDefinition,
  link: linkAIDefinition,
  pdf: pdfAIDefinition,
  python: pythonAIDefinition,
  audio: audioAIDefinition,

  // TODO: 나머지 블럭 타입들도 각 폴더에서 정의 후 import
  // video, file, page_mention, latex, github_pr, react_component
  video: {
    type: 'video',
    name: 'Video Block',
    description: 'Video player for local video files.',
    useCases: ['Playing video files', 'Video documentation', 'Recorded demos'],
    basicProperties: {
      url: {
        type: PropertyType.URL,
        description: 'URL of the video file',
        required: true,
      },
      title: {
        type: PropertyType.TEXT,
        description: 'Video title',
        required: true,
      },
    },
    actions: [],
    examples: [],
  },

  file: {
    type: 'file',
    name: 'File Block',
    description: 'Generic file attachment.',
    useCases: ['Attaching documents', 'File storage', 'Resource management'],
    basicProperties: {
      url: {
        type: PropertyType.URL,
        description: 'URL of the file',
        required: true,
      },
      filename: {
        type: PropertyType.TEXT,
        description: 'Display name of the file',
        required: true,
      },
    },
    actions: [],
    examples: [],
  },

  page_mention: {
    type: 'page_mention',
    name: 'Page Mention Block',
    description: 'Reference to another page in the workspace.',
    useCases: [
      'Linking related pages',
      'Creating page hierarchies',
      'Building knowledge graphs',
    ],
    basicProperties: {
      pageId: {
        type: PropertyType.TEXT,
        description: 'UUID of the referenced page',
        required: true,
      },
    },
    actions: [],
    examples: [],
  },

  latex: {
    type: 'latex',
    name: 'LaTeX Block',
    description: 'Mathematical formulas and equations using LaTeX.',
    useCases: [
      'Writing mathematical equations',
      'Scientific documentation',
      'Academic papers',
    ],
    basicProperties: {
      fontSize: {
        type: PropertyType.NUMBER,
        description: 'Font size in pixels',
        default: 16,
      },
    },
    actions: [],
    examples: ['\\frac{a}{b}', 'E = mc^2', '\\sum_{i=1}^{n} x_i'],
  },

  github_pr: {
    type: 'github_pr',
    name: 'GitHub PR Block',
    description:
      'Display GitHub Pull Request information. PR data is auto-fetched.',
    useCases: [
      'Tracking PRs',
      'Code review references',
      'Development workflow',
    ],
    basicProperties: {
      prUrl: {
        type: PropertyType.URL,
        description: 'GitHub Pull Request URL',
        required: true,
      },
    },
    actions: [
      {
        name: 'fetchPRData',
        description: 'Fetch latest PR data from GitHub',
        params: {},
      },
    ],
    examples: ['https://github.com/owner/repo/pull/123'],
  },

  react_component: {
    type: 'react_component',
    name: 'React Component Block',
    description: 'Custom React component with live preview.',
    useCases: [
      'Interactive UI components',
      'Custom visualizations',
      'Embedded apps',
    ],
    basicProperties: {
      componentCode: {
        type: PropertyType.TEXT,
        description: 'React component code',
        required: true,
      },
    },
    actions: [
      {
        name: 'formatCode',
        description: 'Format the React component code',
        params: {},
      },
    ],
    examples: [
      'export default function App() {\n  return <div>Hello</div>;\n}',
    ],
  },
};

/**
 * 블럭 타입 디테일 정보 조회
 */
export function getBlockTypeDetail(
  blockType: string
): BlockTypeDefinition | null {
  return BLOCK_TYPE_DEFINITIONS[blockType] || null;
}

/**
 * 블럭 타입 검색 (키워드 기반)
 */
export function searchBlockTypes(query: string): BlockTypeDefinition[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(BLOCK_TYPE_DEFINITIONS).filter(def => {
    return (
      def.name.toLowerCase().includes(lowerQuery) ||
      def.description.toLowerCase().includes(lowerQuery) ||
      def.useCases.some(useCase => useCase.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * 시스템 프롬프트용 블럭 타입 리스트
 */
export function getBlockTypeListForPrompt(): string {
  return ALL_BLOCK_TYPES.map(type => {
    const def = BLOCK_TYPE_DEFINITIONS[type];
    if (!def) return `- ${type}`;
    return `- **${type}**: ${def.description}`;
  }).join('\n');
}
