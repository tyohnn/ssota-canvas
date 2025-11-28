/**
 * Text Block Editor Schema
 *
 * 텍스트 블록의 에디터 패널 UI 렌더링 스키마
 */

import { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const textEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.TEXT,

  groups: [
    {
      id: 'style',
      label: 'Style',
      description: 'Text styling options',
      defaultCollapsed: false,
      order: 1,
      properties: ['color', 'textAlign', 'fontSize', 'richStyle'],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: true,
      order: 2,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // Style
    color: {
      label: 'Text Color',
      inputType: 'color',
      icon: 'Palette',
      description: 'Color of the text',
      order: 2,
    },
    textAlign: {
      label: 'Text Alignment',
      inputType: 'select',
      icon: 'AlignLeft',
      description: 'Text alignment direction',
      order: 3,
      options: [
        { id: 'left', value: 'left', label: 'Left', order: 1 },
        { id: 'center', value: 'center', label: 'Center', order: 2 },
        { id: 'right', value: 'right', label: 'Right', order: 3 },
      ],
    },
    fontSize: {
      label: 'Font Size',
      inputType: 'select',
      icon: 'Type',
      description: 'Text size',
      order: 4,
      options: [
        { id: '14px', value: '14px', label: 'Small (14px)', order: 1 },
        { id: '16px', value: '16px', label: 'Medium (16px)', order: 2 },
        { id: '20px', value: '20px', label: 'Large (20px)', order: 3 },
        { id: '24px', value: '24px', label: 'Extra Large (24px)', order: 4 },
      ],
    },
    richStyle: {
      label: 'Rich Style',
      inputType: 'checkbox',
      icon: 'Bold',
      description: 'Enable rich text styling',
      order: 5,
    },

    // Metadata (read-only)
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 6,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: 'Date when the block was last updated',
      order: 8,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: 'Created By',
      inputType: 'readonly-profile',
      icon: 'User',
      description: 'User who created the block',
      order: 9,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        // UserProfile type: userId, email, name, profileImageUrl
        return value.name || value.email || 'Unknown';
      },
    },
  },
};
