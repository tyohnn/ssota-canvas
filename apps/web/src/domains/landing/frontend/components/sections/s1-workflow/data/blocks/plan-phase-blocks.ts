/**
 * Plan Phase Blocks
 *
 * Phase 0 (Plan)의 블록 정의
 */

import type { Node } from '@xyflow/react';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import {
  FontSize,
  TextAlign,
} from '@/domains/block-management/shared/value-objects/block-properties';

export const AUDIO_MEETING_BLOCK: Node = {
  id: 'audio-meeting',
  type: 'audio',
  position: { x: 50, y: 260 },
  data: {
    blockId: 'audio-meeting',
    blockMountId: 'audio-meeting',
    blockType: 'audio',
    title: 'Team Meeting Recording',
    content: {},
    properties: {
      audioUrl:
        'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3',
      title: 'Product Planning Meeting',
      artist: 'Product Team',
      playbackRate: 1,
      volume: 0.8,
    },
    customProperties: [],
  },
  width: 400,
  height: 180,
};

export const MARKDOWN_MEETING_NOTES_BLOCK: Node = {
  id: 'markdown-meeting-notes',
  type: 'markdown',
  position: { x: 630, y: 200 },
  data: {
    blockId: 'markdown-meeting-notes',
    blockMountId: 'markdown-meeting-notes',
    blockType: 'markdown',
    title: 'Meeting Notes - Product Planning',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Product Planning Meeting' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
            { type: 'text', text: 'Nov 27, 2025' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Attendees: ' },
            { type: 'text', text: 'Product Team, Design Lead, Tech Lead' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Duration: ' },
            { type: 'text', text: '2 hours' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📋 Agenda' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Review user feedback from beta testers',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Define Information Architecture for dashboard',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Plan user flow for new users' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Prioritize features for MVP release',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '💡 Key Discussions' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: 'User Feedback Highlights:',
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '85% of users want real-time collaboration features',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Mobile responsiveness is critical for 60% of users',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Integration with Slack/Discord highly requested',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: 'Technical Considerations:',
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'WebSocket implementation for real-time sync',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Database optimization for large canvas data',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '✅ Decisions Made' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Focus on desktop experience first, mobile in Q2',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Implement real-time collaboration as priority feature',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Launch MVP with core features by end of Q1 2026',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🎯 Action Items' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Design Team: ',
                    },
                    {
                      type: 'text',
                      text: 'Create user flow wireframes by Dec 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Tech Team: ',
                    },
                    {
                      type: 'text',
                      text: 'Research WebSocket libraries and POC by Dec 5',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Product Team: ',
                    },
                    {
                      type: 'text',
                      text: 'Finalize MVP feature list and create roadmap',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    properties: {},
    customProperties: [],
  },
  width: 400,
  height: 400,
};

export const USERFLOW_TITLE_BLOCK: Node = {
  id: 'userflow-title',
  type: 'text',
  position: { x: 50, y: 570 },
  data: {
    blockId: 'userflow-title',
    blockMountId: 'userflow-title',
    blockType: 'text',
    title: 'User Flow',
    content: {},
    properties: {
      richStyle: true,
      color: ColorToken.AMBER,
      textAlign: TextAlign.CENTER,
      fontSize: FontSize.XLARGE,
    },
    customProperties: [],
  },
  width: 150,
  height: 40,
};

export const UF_LANDING_BLOCK: Node = {
  id: 'uf-landing',
  type: 'shape',
  position: { x: 50, y: 670 },
  data: {
    blockId: 'uf-landing',
    blockMountId: 'uf-landing',
    blockType: 'shape',
    title: 'Visit Site',
    properties: {
      shapeType: 'ellipse',
      color: 'pink',
      borderStyle: 'solid',
      content: 'Visit Site',
    },
    customProperties: [],
  },
  width: 130,
  height: 80,
};

export const UF_SIGNUP_BLOCK: Node = {
  id: 'uf-signup',
  type: 'shape',
  position: { x: 250, y: 670 },
  data: {
    blockId: 'uf-signup',
    blockMountId: 'uf-signup',
    blockType: 'shape',
    title: 'Sign Up',
    properties: {
      shapeType: 'rectangle',
      color: 'blue',
      borderStyle: 'solid',
      content: 'Sign Up',
    },
    customProperties: [],
  },
  width: 130,
  height: 80,
};

export const UF_ONBOARDING_BLOCK: Node = {
  id: 'uf-onboarding',
  type: 'shape',
  position: { x: 450, y: 670 },
  data: {
    blockId: 'uf-onboarding',
    blockMountId: 'uf-onboarding',
    blockType: 'shape',
    title: 'Onboarding',
    properties: {
      shapeType: 'rectangle',
      color: 'amber',
      borderStyle: 'solid',
      content: 'Onboard',
    },
    customProperties: [],
  },
  width: 140,
  height: 80,
};

export const UF_CREATE_WORKSPACE_BLOCK: Node = {
  id: 'uf-create-workspace',
  type: 'shape',
  position: { x: 650, y: 670 },
  data: {
    blockId: 'uf-create-workspace',
    blockMountId: 'uf-create-workspace',
    blockType: 'shape',
    title: 'Create Workspace',
    properties: {
      shapeType: 'rectangle',
      color: 'green',
      borderStyle: 'solid',
      content: 'Create WS',
    },
    customProperties: [],
  },
  width: 140,
  height: 80,
};

export const UF_FIRST_CANVAS_BLOCK: Node = {
  id: 'uf-first-canvas',
  type: 'shape',
  position: { x: 850, y: 670 },
  data: {
    blockId: 'uf-first-canvas',
    blockMountId: 'uf-first-canvas',
    blockType: 'shape',
    title: 'First Canvas',
    properties: {
      shapeType: 'rectangle',
      color: 'purple',
      borderStyle: 'solid',
      content: 'Start',
    },
    customProperties: [],
  },
  width: 130,
  height: 80,
};

// 애니메이션 순서대로 블록 배열
export const PLAN_PHASE_BLOCKS_SEQUENCE = [
  AUDIO_MEETING_BLOCK,
  MARKDOWN_MEETING_NOTES_BLOCK,
  USERFLOW_TITLE_BLOCK,
  UF_LANDING_BLOCK,
  UF_SIGNUP_BLOCK,
  UF_ONBOARDING_BLOCK,
  UF_CREATE_WORKSPACE_BLOCK,
  UF_FIRST_CANVAS_BLOCK,
];
