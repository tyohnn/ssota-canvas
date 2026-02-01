/**
 * Shape Editor Panel Content Area
 *
 * Shape block editor content - Title + Properties + Tabs (Note)
 */

'use client';

import { useState } from 'react';
import { JSONContent } from '@tiptap/react';
import { Box } from '@/components/ui/box';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LandingTitleInput } from '../../../../../../../../mocks/editor-panel/sections/LandingTitleInput';
import { MockShapePropertiesSection } from './MockShapePropertiesSection';
import { LandingNoteSection } from '../../../../../../../../mocks/editor-panel/common-tabs/LandingNoteSection';

// Thesis shape block의 노트 내용
const THESIS_NOTE_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Key Insights' }],
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
                { type: 'text', text: 'The core thesis challenges traditional MVP thinking by emphasizing ' },
                { type: 'text', marks: [{ type: 'bold' }], text: 'evolution over minimum viability' },
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
                { type: 'text', text: 'User acquisition should be treated as a ' },
                { type: 'text', marks: [{ type: 'bold' }], text: 'search problem' },
                { type: 'text', text: ', not a persuasion challenge' },
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
                { type: 'text', text: 'Early adopters with burning needs are rare but essential for initial traction' },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Implementation Notes' }],
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
                { type: 'text', text: 'Focus on identifying "Gustafs" — early adopters who actively seek new solutions' },
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
                { type: 'text', text: 'Charge real money from day one to get sharper, more honest feedback' },
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
                { type: 'text', text: 'Iterate quickly based on anthropological study of user behavior rather than assumptions' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

interface ShapeEditorPanelContentProps {
  shapeBlockData: {
    blockId: string;
    title: string;
    properties: {
      shapeType: string;
      color: string;
      borderStyle: string;
    };
  };
}

export function ShapeEditorPanelContent({ shapeBlockData }: ShapeEditorPanelContentProps) {
  const [selectedTabId, setSelectedTabId] = useState('note');

  return (
    <Box
      className="flex-1 min-h-0 overflow-y-auto"
      data-content-area-scroll-container="true"
    >
      {/* Title Section */}
      <LandingTitleInput title={shapeBlockData.title} />

      {/* Block Properties (Schema-based) */}
      <MockShapePropertiesSection shapeBlockData={shapeBlockData} />

      {/* Tabs - Note only */}
      <Box className="my-4">
        <Tabs value={selectedTabId} onValueChange={setSelectedTabId}>
          <Box className="sticky top-0 z-50 bg-background px-6 py-2">
            <TabsList className="justify-start">
              <TabsTrigger value="note">Note</TabsTrigger>
            </TabsList>
          </Box>
          <Box className="px-0">
            <TabsContent value="note">
              <LandingNoteSection content={THESIS_NOTE_CONTENT} />
            </TabsContent>
          </Box>
        </Tabs>
      </Box>
    </Box>
  );
}
