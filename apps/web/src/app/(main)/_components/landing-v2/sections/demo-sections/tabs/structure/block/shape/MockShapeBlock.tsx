"use client";

/**
 * MockShapeBlock
 *
 * Structure 탭 전용 Shape 블록.
 * Argument Map 노드 렌더링 전용.
 * Step 6+: Thesis block becomes selected and shows toolbar
 */

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseBlockView } from "@/domains/block-management/frontend/components/block/base-block/components/base-block-view";
import { Content } from "@/domains/block-management/frontend/components/block/base-block/components/content";
import { ResizeControlView } from "@/domains/block-management/frontend/components/block/base-block/components/resize-control.view";
import { HandlesView } from "@/domains/block-management/frontend/components/block/base-block/components/handles.view";
import { DataBlockView } from "@/domains/block-management/frontend/components/block/data-block/components/data-block-view";
import { ShapeBlockView } from "@/domains/block-management/frontend/components/block/block-type/shape/shape-block.view";
import { MockShapeBlockToolbar } from "./MockShapeBlockToolbar";
import { StepHighlight } from "../../../../../../../mocks/components/StepHighlight";
import { ColorToken } from "@/domains/block-management/shared/types/style-tokens.types";
import { ShapeType } from "@/domains/block-management/shared/value-objects/block-properties";
import type { ArgumentMapNode } from "../../mock-argument-map-data";
import { THESIS_NODE_ID } from "../../mock-argument-map-data";

export interface MockShapeBlockData extends Record<string, unknown> {
  nodeData: ArgumentMapNode;
  step?: number;
}

const colorStringToToken: Record<string, ColorToken> = {
  red: ColorToken.RED,
  orange: ColorToken.ORANGE,
  amber: ColorToken.AMBER,
  green: ColorToken.GREEN,
  blue: ColorToken.BLUE,
  purple: ColorToken.PURPLE,
  pink: ColorToken.PINK,
  gray: ColorToken.GRAY,
};

const shapeStringToType: Record<string, ShapeType> = {
  rectangle: ShapeType.RECTANGLE,
  ellipse: ShapeType.ELLIPSE,
  diamond: ShapeType.DIAMOND,
  triangle: ShapeType.TRIANGLE,
  hexagon: ShapeType.HEXAGON,
  parallelogram: ShapeType.PARALLELOGRAM,
  cylinder: ShapeType.CYLINDER,
};

function MockShapeBlockComponent({ data, selected, width, height }: NodeProps) {
  const blockData = (data as MockShapeBlockData).nodeData;
  const step = (data as MockShapeBlockData).step ?? 0;

  if (!blockData) {
    return null;
  }

  const nodeWidth = typeof width === "number" ? width : 180;
  const nodeHeight = typeof height === "number" ? height : 100;

  // Step 18+: Show toolbars when selected (step 17: shape 클릭, step 18: Details, step 19: 패널)
  const showToolbars = selected && step >= 18;

  const colorToken =
    colorStringToToken[blockData.color || "blue"] || ColorToken.BLUE;
  const shapeType =
    shapeStringToType[blockData.shapeType || "rectangle"] || ShapeType.RECTANGLE;
  const effectiveShapeType =
    blockData.type === "markdown" ? ShapeType.RECTANGLE : shapeType;
  const borderStyle =
    (blockData.borderStyle as "solid" | "dashed" | "dotted") || "solid";

  const mockBlockData = {
    blockId: blockData.id,
    blockMountId: blockData.id,
    title: blockData.title,
    blockType: "shape" as const,
    properties: {
      shapeType: effectiveShapeType,
      color: colorToken,
      borderStyle,
    },
  };

  const renderOriginalView = () => (
    <ShapeBlockView
      shapeType={effectiveShapeType}
      color={colorToken}
      borderStyle={borderStyle}
      content={blockData.title}
      width={nodeWidth}
      height={nodeHeight}
      selected={selected}
    />
  );

  return (
    <BaseBlockView
      data={mockBlockData as any}
      width={nodeWidth}
      height={nodeHeight}
      draggable={false}
      onMouseEnter={() => { }}
      onMouseMove={() => { }}
      onMouseLeave={() => { }}
      showAddButtonZones={false}
      setHoverDirection={() => { }}
    >
      {showToolbars && (
        <MockShapeBlockToolbar
          title={blockData.title}
          width={nodeWidth}
          blockId={mockBlockData.blockId}
          blockMountId={mockBlockData.blockMountId}
          currentShapeType={effectiveShapeType}
          currentColor={colorToken}
          currentBorderStyle={borderStyle}
          step={step}
        />
      )}

      <ResizeControlView
        nodeId={mockBlockData.blockMountId}
        show={false}
        keepAspectRatio={true}
        onResizeStart={() => { }}
        onResizeEnd={async () => { }}
      />

      <HandlesView
        isConnectable={false}
        showLeft={false}
        showRight={false}
        showTop={false}
        showBottom={false}
      />

      <Content textColorClass="">
        {step === 17 && blockData.id === THESIS_NODE_ID ? (
          <StepHighlight
            isActive={true}
            pointer="top"
            label="Click shape"
            className="block w-full h-full"
            cursorAction="click"
          >
            <DataBlockView
              viewMode="original"
              data={mockBlockData as any}
              renderOriginalView={renderOriginalView}
              selected={false}
            />
          </StepHighlight>
        ) : (
          <DataBlockView
            viewMode="original"
            data={mockBlockData as any}
            renderOriginalView={renderOriginalView}
            selected={selected}
          />
        )}
      </Content>
    </BaseBlockView>
  );
}

export const MockShapeBlock = memo(MockShapeBlockComponent);
