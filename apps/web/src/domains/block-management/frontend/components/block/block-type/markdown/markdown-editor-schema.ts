/**
 * Markdown Block Editor Schema
 *
 * Markdown block editor panel UI rendering schema
 */

import { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

export const markdownEditorSchema: BlockEditorSchema = {
  blockType: BlockType.MARKDOWN,

  groups: [
    {
      id: 'style',
      label: 'Style',
      description: 'Block styling settings',
      defaultCollapsed: true,
      order: 1,
      properties: ['color'],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: true,
      order: 100,
      properties: ['createdAt', 'updatedAt'],
    },
  ],

  properties: {
    color: {
      label: 'Background Color',
      inputType: 'color',
      description: 'Block background color',
      options: Object.values(ColorToken).map(token => ({
        id: token,
        value: token,
        label: token,
        order: 0,
      })),
      order: 1,
    },
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      description: 'Date when the block was created',
      order: 101,
      readonly: true,
    },
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      description: 'Date when the block was last updated',
      order: 102,
      readonly: true,
    },
  },
};
