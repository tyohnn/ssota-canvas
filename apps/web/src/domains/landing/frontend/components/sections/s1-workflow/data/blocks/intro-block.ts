/**
 * Intro Block (SSOTA Hexagon)
 *
 * 초기 화면에 표시되는 중앙 육각형 블록
 */

import type { Node } from '@xyflow/react';

export const SSOTA_HEXAGON_BLOCK: Node = {
  id: 'ssota-hexagon',
  type: 'shape',
  position: { x: 400, y: 240 },
  data: {
    blockId: 'ssota-hexagon',
    blockMountId: 'ssota-hexagon',
    blockType: 'shape',
    title: 'SSOTA',
    properties: {
      shapeType: 'hexagon',
      color: 'blue',
      borderStyle: 'solid',
    },
    customProperties: [],
  },
  width: 200,
  height: 120,
};
