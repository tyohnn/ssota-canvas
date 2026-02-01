/**
 * Mock Shape Block Toolbar
 *
 * Replicated from Block Toolbar (상단 툴바) - DataBlock과 동일한 구조
 * BlockToolbarView + BlockHeaderView + ShapeTypeToolbarItem + ColorToolbarItem + BorderStyleToolbarItem + Details + MoreMenu
 */

'use client';

import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { StepHighlight } from "../../../../../../../mocks/components/StepHighlight";
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Separator } from '@/components/ui/separator';
import { BlockToolbarView } from '@/domains/block-management/frontend/components/block/data-block/components/block-toolbar.view';
import { BlockHeaderView } from '@/domains/block-management/frontend/components/block/data-block/components/block-header/components/block-header-view';
import { ColorToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/color-toolbar-item';
import { BorderStyleToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/border-style-toolbar-item';
import { MoreMenuView } from '@/domains/block-management/frontend/components/block/common-toolbar-items/more-menu-toolbar-item/components/more-menu-view';
import { ShapeTypeToolbarItem } from '@/domains/block-management/frontend/components/block/block-type/shape/components/toolbar-items/shape-type-toolbar-item';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { ShapeType } from '@/domains/block-management/shared/value-objects/block-properties';

const MOCK_TITLE = 'Claim';

interface MockShapeBlockToolbarProps {
  title?: string;
  width?: number;
  blockId?: string;
  blockMountId?: string;
  currentShapeType?: ShapeType;
  currentColor?: ColorToken;
  currentBorderStyle?: 'solid' | 'dashed' | 'dotted';
  step?: number;
}

export function MockShapeBlockToolbar({
  title = MOCK_TITLE,
  width = 180,
  blockId = 'mock-shape-block-id',
  blockMountId,
  currentShapeType = ShapeType.RECTANGLE,
  currentColor = ColorToken.BLUE,
  currentBorderStyle = 'solid',
  step = 0,
}: MockShapeBlockToolbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const headerContent = (
    <BlockHeaderView
      title={title}
      blockType="shape"
      width={width}
      onTitleChange={() => { }}
      onKeyDown={() => { }}
      onBlur={() => { }}
      inputRef={inputRef}
      isUpdating={false}
      readonly={true}
      showBadge={width > 400}
    />
  );

  const toolbarItems = (
    <>
      <ShapeTypeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentShapeType={currentShapeType}
        disabled={false}
        onShapeTypeChange={async () => { }}
        zoom={1}
      />
      <ColorToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentColor={currentColor}
        disabled={false}
        onColorChange={async () => { }}
        zoom={1}
      />
      <BorderStyleToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentBorderStyle={currentBorderStyle}
        disabled={false}
        onBorderStyleChange={async () => { }}
        zoom={1}
      />
      <Separator orientation="vertical" className="h-4!" />
      <StepHighlight
        isActive={step === 18}
        pointer="top"
        label="Details"
        className="inline-block"
        cursorAction={step === 18 ? "click" : undefined}
      >
        <ToolbarIconButton
          icon={<ChevronRight />}
          tooltip="Details"
          tooltipSide="top"
          tooltipOffset={5}
          onClick={() => { }}
          onMouseDown={e => e.stopPropagation()}
          className="h-6 w-6 p-0 rounded-sm"
          iconClassName="size-3.5"
        />
      </StepHighlight>
      {blockMountId != null && (
        <>
          <Separator orientation="vertical" className="h-4!" />
          <MoreMenuView
            blockMountId={blockMountId}
            business={{
              handleEdit: () => { },
              handleDuplicate: async () => { },
              handleCreateComponent: () => { },
              handleDelete: async () => { },
            }}
            showPageMove={false}
          />
        </>
      )}
    </>
  );

  return (
    <BlockToolbarView
      headerContent={headerContent}
      toolbarItems={toolbarItems}
    />
  );
}
