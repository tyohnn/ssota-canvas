/**
 * Image Block Editor Panel Schema
 *
 * Image block editor panel UI rendering schema
 */

import { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const imageEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.IMAGE,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Image block basic information',
      defaultCollapsed: false,
      order: 1,
      properties: ['imageUrl', 'caption'],
    },
    // {
    //   id: 'style',
    //   label: 'Style',
    //   description: 'Image styling settings',
    //   defaultCollapsed: false,
    //   order: 2,
    //   properties: ['objectFit'],
    // },
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
    imageUrl: {
      label: 'Image',
      inputType: 'image-upload',
      icon: 'Image',
      description: 'Upload image file',
      order: 1,
      readonly: false,
    },
    caption: {
      label: 'Caption',
      inputType: 'text',
      icon: 'MessageSquare',
      description: 'Image description or caption (displayed at the bottom)',
      placeholder: 'Enter caption...',
      order: 2,
    },
    // alt: {
    //   label: 'Alt Text',
    //   inputType: 'text',
    //   icon: 'AudioLines',
    //   description: 'Alternative text for accessibility',
    //   placeholder: 'Describe the image...',
    //   order: 3,
    // },
    // objectFit: {
    //   label: 'Object Fit',
    //   inputType: 'select',
    //   icon: 'Maximize',
    //   description: 'How the image fits into the container',
    //   order: 4,
    //   options: [
    //     { id: 'contain', value: 'contain', label: 'Contain', order: 1 },
    //     { id: 'cover', value: 'cover', label: 'Cover', order: 2 },
    //     { id: 'fill', value: 'fill', label: 'Fill', order: 3 },
    //   ],
    // },
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 3,
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
      order: 4,
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
      order: 5,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        return value.name || value.email || 'Unknown';
      },
    },
  },
};
