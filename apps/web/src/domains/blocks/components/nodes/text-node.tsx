"use client";

import { memo, useState } from 'react';
import { Handle, Position, Node } from '@xyflow/react';
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { NodeTopToolbar } from "./node-top-toolbar";
import { useNodeKeyboardShortcuts } from "../../hooks/use-node-keyboard-shortcuts";
import type { ReactFlowTextNodeData } from "@/domains/blocks/types/text.node";
import { 
  ColorToolbarItem, 
  TextAlignToolbarItem, 
  RichStyleToolbarItem 
} from "./toolbar-items";
import { TextContent } from "./text-content";
import { NodeResizeControls } from "./node-resize-controls";

type TextNodeProps = {
  id: string;
  type: string;
  data: ReactFlowTextNodeData;
  selected?: boolean;
  width?: number;
  position?: { x: number; y: number };
  // height?: number;
};

const TextNode = ({ 
  id,
  type,
  selected,
  position = { x: 0, y: 0 },
  data,
  width = 200,
}: TextNodeProps) => {
  // 현재 노드 객체 생성 (props 기반)
  const currentNode: Node = {
    id,
    type,
    selected,
    position,
    data,
    width: width,
    // height: height,
  };
  
  // 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);

  // 색상 처리
  const rawColor = data.nodeUI.color ?? ShapePolicy.getDefaultColor();
  const availableColors = ShapePolicy.getColorOptions().map((c) => c.value);
  const color = rawColor.startsWith("#")
    ? ShapePolicy.getClosestColorKey(rawColor)
    : availableColors.includes(rawColor)
      ? (rawColor as ColorKey)
      : ShapePolicy.getDefaultColor();
  const tailwindBorderColor = ShapePolicy.getTailwindBorderColor(color);
  const textColor = ShapePolicy.getTextColor(color);
  const backgroundColor = ShapePolicy.getShapeBackgroundColor(color);
  const tailwindOutlineColor = ShapePolicy.getTailwindOutlineColor(color);

  // 키보드 숏컷
  useNodeKeyboardShortcuts(id, selected || false);
  
  // 툴바 아이템들
  const toolbarItems = (
    <>
      <RichStyleToolbarItem
        node={currentNode}
        isRichStyle={data.nodeUI.richStyle}
      />
      
      <TextAlignToolbarItem
        node={currentNode}
        currentAlign={data.nodeUI.textAlign}
      />
      
      <ColorToolbarItem
        node={currentNode}
        currentColor={color}
      />
    </>
  );

  return (
    <>
      {/* 리사이즈 컨트롤 */}
      <NodeResizeControls
        node={currentNode}
        selected={selected || false}
        resizeDirection="horizontal"
        minWidth={100}
      />

      {/* 상단 툴바 */}
      <NodeTopToolbar
        node={currentNode}
        toolbarItems={toolbarItems}
      />

      {/* 핸들 */}
      {/* <Handle type="target" position={Position.Left} className="opacity-50 w-2.5 h-2.5" /> */}

      {/* 노드 본문 */}
      <div
        className={`w-full p-2 rounded-md transition-colors relative flex overflow-hidden ${tailwindOutlineColor} ${selected ? 'outline-4' : 'outline-0'}`}
        style={{ 
          backgroundColor: data.nodeUI.richStyle ? backgroundColor : 'transparent',
          width: width,
          // height: height,
          outlineOffset: '0px',
        }}
      >
        <TextContent
          node={currentNode}
          title={data.title || ''}
          isEditing={isEditing}
          onEditingChange={setIsEditing}
          selected={selected || false}
          textAlign={data.nodeUI.textAlign}
          fontSize={data.nodeUI.fontSize}
          fontWeight={data.nodeUI.weight}
          textColor={textColor}
          width={width}
          // height={height}
        />
      </div>

      {/* <Handle type="source" position={Position.Right} className="opacity-50 w-2.5 h-2.5" /> */}
    </>
  );
};

export default memo(TextNode);
