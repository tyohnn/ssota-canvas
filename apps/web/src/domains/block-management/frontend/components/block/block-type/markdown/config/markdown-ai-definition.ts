/**
 * Markdown Block AI Definition
 *
 * AI Agent가 Markdown 블럭을 이해하고 조작하기 위한 정의
 * - Basic Properties 스키마
 * - Available Actions
 * - Usage Examples
 */

import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const markdownAIDefinition: BlockTypeDefinition = {
  type: 'markdown',
  name: 'Markdown Block',
  description:
    'Rich text editor with markdown support. Best for notes, documentation, and formatted text content.',
  useCases: [
    'Taking notes with formatting (bold, italic, headers)',
    'Writing documentation',
    'Creating to-do lists',
    'Organizing thoughts with bullet points',
    'Embedding links and images in text',
  ],
  basicProperties: {
    color: {
      type: 'enum',
      description: 'Color theme of the block',
      options: Object.values(ColorToken),
      default: ColorToken.GRAY,
    },
  },
  actions: [
    {
      name: 'summarize',
      description: 'Generate a summary of the markdown content using AI',
    },
    {
      name: 'translate',
      description: 'Translate the content to another language',
      params: {
        targetLanguage: {
          type: PropertyType.TEXT,
          description: 'Target language code (e.g., "ko", "en", "ja")',
          required: true,
        },
      },
    },
  ],
  examples: [
    '# Meeting Notes\n\n## Attendees\n- John\n- Sarah\n\n## Action Items\n- [ ] Review proposal\n- [ ] Schedule follow-up',
    '**Bold text** and *italic text* with [links](https://example.com)',
  ],
};
