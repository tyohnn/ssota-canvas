/**
 * Text Block AI Definition
 */

import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import {
  PropertyType,
  TextAlign,
  FontSize,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const textAIDefinition: BlockTypeDefinition = {
  type: 'text',
  name: 'Text Block',
  description:
    'Simple plain text block without formatting. Best for quick notes and simple content.',
  useCases: [
    'Quick notes without formatting',
    'Simple labels or titles',
    'Plain text content',
  ],
  basicProperties: {
    color: {
      type: 'enum',
      description: 'Color theme of the block',
      options: Object.values(ColorToken),
      default: ColorToken.GRAY,
    },
    richStyle: {
      type: PropertyType.BOOLEAN,
      description: 'Enable rich styling with background and border',
      default: false,
    },
    textAlign: {
      type: 'enum',
      description: 'Text alignment',
      options: Object.values(TextAlign),
      default: TextAlign.LEFT,
    },
    fontSize: {
      type: 'enum',
      description: 'Font size',
      options: Object.values(FontSize),
      default: FontSize.MEDIUM,
    },
  },
  actions: [],
  examples: ['Simple note', 'Quick reminder'],
};
