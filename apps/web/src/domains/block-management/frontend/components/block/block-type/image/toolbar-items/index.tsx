import React from 'react';
import { ImageChangeToolbarItem } from './image-change-toolbar-item';
import { ObjectFitToolbarItem } from './object-fit-toolbar-item';
import { CaptionVisibilityToolbarItem } from './caption-visibility-toolbar-item';
import { ExpandImageToolbarItem } from './expand-image-toolbar-item';
import {
  ImageSpaceContainer,
  ImageSpaceExploreTrigger,
  ImageSpaceEditorTrigger,
} from '@/domains/image-app-space/frontend';
import { Separator } from '@workspace/ui/components/ui/separator';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function ImageToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
  onPropertyUpdate,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: any;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
}) {
  const imageProperties = blockData.properties;

  return (
    <>
      <ImageSpaceContainer blockId={blockId} blockData={blockData}>
        <ImageSpaceExploreTrigger />
        <ImageSpaceEditorTrigger />
      </ImageSpaceContainer>
      <ImageChangeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentValue={imageProperties.imageUrl}
        disabled={disabled}
        orgId={blockData.orgId}
        workspaceId={blockData.workspaceId}
        pageId={blockData.pageId}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.imageUrl', url);
        }}
        onPropertiesChange={async (properties: Record<string, any>) => {
          // ✅ 여러 속성을 한번에 업데이트
          for (const [key, value] of Object.entries(properties)) {
            await onPropertyUpdate(`properties.${key}`, value);
          }
        }}
      />
      <ObjectFitToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentValue={imageProperties.objectFit}
        disabled={disabled}
        onValueChange={async (objectFit: any) => {
          await onPropertyUpdate('properties.objectFit', objectFit);
        }}
      />
      <Separator orientation="vertical" className="h-6" />
      <CaptionVisibilityToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentValue={imageProperties.isCaptionVisible ?? false}
        disabled={disabled}
        onValueChange={async (value: boolean) => {
          await onPropertyUpdate('properties.isCaptionVisible', value);
        }}
      />
      <ExpandImageToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        imageUrl={imageProperties.imageUrl}
        alt={imageProperties.alt}
        disabled={disabled || !imageProperties.imageUrl}
      />
    </>
  );
}
