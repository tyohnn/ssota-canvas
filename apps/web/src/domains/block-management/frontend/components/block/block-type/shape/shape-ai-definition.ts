import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { ShapeType, BorderStyle } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const shapeAIDefinition: BlockTypeDefinition = {
  type: 'shape',
  name: 'Shape Block',
  description: 'Geometric shapes for visual organization and diagrams.',
  useCases: ['Creating flowcharts', 'Visual organization', 'Highlighting areas', 'Creating diagrams'],
  basicProperties: {
    shapeType: {
      type: 'enum',
      description: 'Type of shape',
      options: Object.values(ShapeType),
      default: ShapeType.RECTANGLE,
    },
    color: {
      type: 'enum',
      description: 'Color theme of the shape',
      options: Object.values(ColorToken),
      default: ColorToken.BLUE,
    },
    borderStyle: {
      type: 'enum',
      description: 'Border style',
      options: ['solid', 'dashed', 'dotted'] as BorderStyle[],
      default: 'solid' as BorderStyle,
    },
  },
  actions: [],
  examples: [],
};

