/**
 * Block Actions Registry
 * 모든 블럭 타입의 액션을 중앙 관리
 *
 * 목적:
 * 1. AI Agent가 사용 가능한 액션 검색
 * 2. Dynamic Tool 실행을 위한 메타데이터 제공
 * 3. 타입 안전성 확보
 */

export interface BlockActionDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  examples?: string[];
  category?: string;
}

export interface BlockTypeRegistry {
  type: string;
  displayName: string;
  actions: BlockActionDefinition[];
}

/**
 * 블럭 타입별 액션 레지스트리
 */
export const BLOCK_ACTIONS_REGISTRY: Record<string, BlockTypeRegistry> = {
  youtube: {
    type: 'youtube',
    displayName: 'YouTube',
    actions: [
      {
        name: 'extractScript',
        description: 'Extract transcript/subtitles from YouTube video',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: [
          'Extract the script',
          'Get YouTube transcript',
          'Download subtitles',
        ],
        category: 'content',
      },
      {
        name: 'summarize',
        description: 'Summarize YouTube video content using AI',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Summarize this video', 'Create summary', 'TL;DR'],
        category: 'ai',
      },
    ],
  },

  pdf: {
    type: 'pdf',
    displayName: 'PDF',
    actions: [
      {
        name: 'extractContent',
        description: 'Extract text content from PDF',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Extract text', 'Get PDF content', 'Parse PDF'],
        category: 'content',
      },
      {
        name: 'summarize',
        description: 'Summarize PDF content using AI',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Summarize PDF', 'Create summary', 'TL;DR'],
        category: 'ai',
      },
      {
        name: 'nextPage',
        description: 'Go to the next page',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Next page', 'Go forward'],
        category: 'navigation',
      },
      {
        name: 'previousPage',
        description: 'Go to the previous page',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Previous page', 'Go back'],
        category: 'navigation',
      },
      {
        name: 'zoom',
        description: 'Zoom in or out',
        inputSchema: {
          type: 'object',
          properties: {
            level: {
              type: 'number',
              description: 'Zoom level (50-200%)',
              minimum: 50,
              maximum: 200,
            },
          },
          required: ['level'],
        },
        examples: ['Zoom to 150%', 'Zoom in', 'Zoom out'],
        category: 'view',
      },
    ],
  },

  python: {
    type: 'python',
    displayName: 'Python',
    actions: [
      {
        name: 'run',
        description: 'Execute Python code',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Run code', 'Execute', 'Run this'],
        category: 'execution',
      },
      {
        name: 'format',
        description: 'Format code with Black formatter',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Format code', 'Auto-format', 'Fix formatting'],
        category: 'formatting',
      },
      {
        name: 'lint',
        description: 'Run linter on code',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Lint code', 'Check errors', 'Run linter'],
        category: 'quality',
      },
    ],
  },

  image: {
    type: 'image',
    displayName: 'Image',
    actions: [
      {
        name: 'unsplashSearch',
        description: 'Search and replace image from Unsplash',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for Unsplash',
            },
          },
          required: [],
        },
        examples: ['Search Unsplash', 'Find similar image', 'Replace image'],
        category: 'search',
      },
      {
        name: 'generate',
        description: 'Generate image using AI',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Image generation prompt',
            },
          },
          required: [],
        },
        examples: ['Generate image', 'Create AI image', 'Generate with AI'],
        category: 'ai',
      },
      {
        name: 'searchStyle',
        description: 'Search images with similar style',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Find similar style', 'Search by style'],
        category: 'search',
      },
    ],
  },

  link: {
    type: 'link',
    displayName: 'Link',
    actions: [
      {
        name: 'summarize',
        description: 'Summarize linked webpage content',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        examples: ['Summarize link', 'Get summary', 'TL;DR'],
        category: 'ai',
      },
    ],
  },
};

/**
 * 블럭 타입의 액션 목록 조회
 */
export function getBlockActions(blockType: string): BlockActionDefinition[] {
  return BLOCK_ACTIONS_REGISTRY[blockType]?.actions || [];
}

/**
 * 모든 액션 검색
 */
export function searchBlockActions(options: {
  blockType?: string;
  actionQuery?: string;
  category?: string;
}): Array<BlockActionDefinition & { blockType: string }> {
  const { blockType, actionQuery, category } = options;

  let actions: Array<BlockActionDefinition & { blockType: string }> = [];

  // blockType 필터링
  if (blockType) {
    const registry = BLOCK_ACTIONS_REGISTRY[blockType];
    if (registry) {
      actions = registry.actions.map(action => ({
        ...action,
        blockType: registry.type,
      }));
    }
  } else {
    // 모든 블럭 타입의 액션
    actions = Object.values(BLOCK_ACTIONS_REGISTRY).flatMap(registry =>
      registry.actions.map(action => ({
        ...action,
        blockType: registry.type,
      }))
    );
  }

  // actionQuery 필터링
  if (actionQuery) {
    const query = actionQuery.toLowerCase();
    actions = actions.filter(
      action =>
        action.name.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.examples?.some(ex => ex.toLowerCase().includes(query))
    );
  }

  // category 필터링
  if (category) {
    actions = actions.filter(action => action.category === category);
  }

  return actions;
}

/**
 * 특정 액션 조회
 */
export function getBlockAction(
  blockType: string,
  actionName: string
): BlockActionDefinition | undefined {
  const actions = getBlockActions(blockType);
  return actions.find(action => action.name === actionName);
}
