import React from 'react';
import { AudioUploadToolbarItem } from './audio-upload-toolbar-item';
import { AudioRecordToolbarItem } from './audio-record-toolbar-item';
import { AudioDownloadToolbarItem } from './audio-download-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function AudioToolbarItems({
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

  const audioProperties = blockData.properties;

  return (
    <>
      <AudioUploadToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        disabled={disabled}
        orgId={blockData.orgId}
        workspaceId={blockData.workspaceId}
        pageId={blockData.pageId}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.audioUrl', url);
        }}
      />
      <AudioRecordToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        disabled={disabled}
        orgId={blockData.orgId}
        workspaceId={blockData.workspaceId}
        pageId={blockData.pageId}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.audioUrl', url);
        }}
      />
      <AudioDownloadToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        audioUrl={audioProperties.audioUrl}
        title={audioProperties.title}
        disabled={disabled || !audioProperties.audioUrl}
      />
    </>
  );
}
