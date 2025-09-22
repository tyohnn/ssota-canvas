'use client';

import React, { useMemo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Position, useReactFlow, Handle } from '@xyflow/react';
import { NodeTopToolbar } from './node-top-toolbar';
import { FreeResizerControl } from './free-resizer-control';
import { TextContent } from './text-content';
import { useReactFlowSelectionCommands } from '@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext';
import {
  ShapePolicy,
  type ColorKey,
  type ShapeKey,
} from '@/domains/blocks/policy/shape-policy';
import {
  ColorToolbarItem,
  ShapeToolbarItem,
  FontSizeToolbarItem,
} from './toolbar-items';
// Import flat structure types
import type { ReactFlowNodeData } from '@/domains/blocks/types/common.node';

export type ShapeNodeData = ReactFlowNodeData;

function Shape({
  shape,
  color,
  width,
  height,
  label,
  selected,
}: {
  shape: ShapeKey;
  color: ColorKey;
  width: number;
  height: number;
  label: string;
  selected?: boolean;
}) {
  const shapeProps = useMemo(
    () =>
      ShapePolicy.getShapeComponentProps(
        shape as ShapeKey,
        color,
        width,
        height
      ),
    [shape, color, width, height]
  );

  const renderShape = () => {
    switch (shape) {
      case 'rect':
        return <rect {...(shapeProps as React.SVGProps<SVGRectElement>)} />;
      case 'circle':
        return (
          <ellipse {...(shapeProps as React.SVGProps<SVGEllipseElement>)} />
        );
      case 'diamond':
      case 'hexagon':
      case 'parallelogram':
      case 'triangle':
        return (
          <polygon {...(shapeProps as React.SVGProps<SVGPolygonElement>)} />
        );
      case 'cylinder':
        return (
          <>
            {/* Top ellipse */}
            <ellipse
              cx={width / 2}
              cy={height / 8}
              rx={width / 2}
              ry={height / 8}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
            {/* Middle rectangle */}
            <rect
              x={0}
              y={height / 8}
              width={width}
              height={(height * 3) / 4}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
            {/* Bottom ellipse */}
            <ellipse
              cx={width / 2}
              cy={(height * 7) / 8}
              rx={width / 2}
              ry={height / 8}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
          </>
        );
      default:
        return <rect {...(shapeProps as React.SVGProps<SVGRectElement>)} />;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      style={{ padding: '2px' }}
    >
      <g key={`shape-${shape}-${color}`}>{renderShape()}</g>
    </svg>
  );
}

export function ShapeNode({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const d = (data || {}) as ShapeNodeData;
  const selectionCommands = useReactFlowSelectionCommands();

  // Local state for text editing mode
  const [isEditing, setIsEditing] = useState(false);

  // Extract values from flat structure with fallbacks
  const nodeUI = d.nodeUI || {};

  const title = d.title ?? 'Label';
  const shape = (nodeUI.shape as ShapeKey) ?? ShapePolicy.getDefaultShape();

  // Color handling with validation and HEX mapping
  const rawColor = (nodeUI?.color as string) ?? ShapePolicy.getDefaultColor();
  const availableColors = ShapePolicy.getColorOptions().map(c => c.value);

  // If rawColor is a HEX value, map it to closest ColorKey
  const color = rawColor.startsWith('#')
    ? ShapePolicy.getClosestColorKey(rawColor)
    : availableColors.includes(rawColor)
      ? (rawColor as ColorKey)
      : ShapePolicy.getDefaultColor();

  const hexBorderColor = ShapePolicy.getBorderColor(color);
  const hexTextColor = ShapePolicy.getTextColor(color);
  const weight = (nodeUI?.weight as string) || 'bold';
  const fontSize = (nodeUI?.fontSize as string) ?? '32px';

  // React Flow props가 최우선, 그 다음 flat nodeUI, 마지막 기본값
  const width = Math.max(
    80,
    (nodeW as number) || (nodeUI?.size?.width as number) || 160
  );
  const height = Math.max(
    40,
    (nodeH as number) || (nodeUI?.size?.height as number) || 64
  );

  // 현재 노드 객체 생성 (props 기반)
  const currentNode = {
    id,
    type: 'shape',
    selected,
    position: { x: 0, y: 0 },
    data: d,
    width,
    height,
  };

  // 키보드 숏컷
  const handleEscape = React.useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (isEditing) {
        setIsEditing(false);
      } else if (selected) {
        // 선택 해제
        selectionCommands.selectNodes([]);
      }
    },
    [isEditing, selected, selectionCommands]
  );

  // 툴바 아이템들
  const toolbarItems = (
    <>
      <ShapeToolbarItem node={currentNode} currentShape={shape} />
      <FontSizeToolbarItem node={currentNode} currentFontSize={fontSize} />
      <ColorToolbarItem node={currentNode} currentColor={color} />
    </>
  );

  return (
    <>
      {/* 리사이즈 컨트롤 */}
      <FreeResizerControl
        node={currentNode}
        selected={selected || false}
        minWidth={80}
        minHeight={40}
        borderColor={hexBorderColor}
        bgColor={hexTextColor}
      />

      {/* 상단 툴바 */}
      <NodeTopToolbar node={currentNode} toolbarItems={toolbarItems} />

      {/* 핸들 */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-50 w-2.5 h-2.5"
      />

      {/* 노드 본문 */}
      <div
        className="relative flex overflow-hidden"
        style={{
          width,
          height,
        }}
      >
        <Shape
          shape={shape}
          color={color}
          width={width}
          height={height}
          label={title as string}
          selected={selected}
        />

        {/* 텍스트 콘텐츠 */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <TextContent
            node={currentNode}
            title={title || ''}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
            selected={selected || false}
            textAlign="center"
            fontSize={fontSize}
            fontWeight={weight}
            textColor={ShapePolicy.getTextColor(color)}
            width={width}
            placeholder="Label"
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="opacity-50 w-2.5 h-2.5"
      />
    </>
  );
}
