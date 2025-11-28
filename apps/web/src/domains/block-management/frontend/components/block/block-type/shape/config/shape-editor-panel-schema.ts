/**
 * Shape Block Editor Schema
 *
 * Shape block editor panel UI rendering schema
 */

import { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const shapeEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.SHAPE,

  groups: [
    {
      id: 'style',
      label: 'Style',
      description: 'Shape styling options',
      defaultCollapsed: false,
      order: 1,
      properties: ['shapeType', 'color', 'borderStyle'],
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
      label: 'Color',
      inputType: 'color',
      icon: 'Palette',
      description: 'Shape color',
      order: 2,
    },
    shapeType: {
      label: 'Shape Type',
      inputType: 'select',
      icon: 'Shapes',
      description: 'Select the type of shape',
      order: 3,
      options: [
        { id: 'rectangle', value: 'rectangle', label: 'Rectangle', order: 1 },
        { id: 'ellipse', value: 'ellipse', label: 'Ellipse', order: 2 },
        { id: 'triangle', value: 'triangle', label: 'Triangle', order: 3 },
        { id: 'diamond', value: 'diamond', label: 'Diamond', order: 4 },
        { id: 'hexagon', value: 'hexagon', label: 'Hexagon', order: 5 },
        {
          id: 'parallelogram',
          value: 'parallelogram',
          label: 'Parallelogram',
          order: 6,
        },
        { id: 'cylinder', value: 'cylinder', label: 'Cylinder', order: 7 },
      ],
    },
    borderStyle: {
      label: 'Border Style',
      inputType: 'select',
      icon: 'Minus',
      description: 'Border style',
      order: 4,
      options: [
        { id: 'solid', value: 'solid', label: 'Solid', order: 1 },
        { id: 'dashed', value: 'dashed', label: 'Dashed', order: 2 },
        { id: 'dotted', value: 'dotted', label: 'Dotted', order: 3 },
      ],
    },

    // Metadata (read-only)
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
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
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: 'Date when the block was last updated',
      order: 5,
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
      order: 6,
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
