import React from 'react';

import { AudioDownloadToolbarItem } from './audio-download-toolbar-item';
import { AudioRecordToolbarItem } from './audio-record-toolbar-item';
import { AudioUploadToolbarItem } from './audio-upload-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function AudioToolbarItems({
  blockId,
  blockData,
  disabled,
  onPropertyUpdate,
}: {
  blockId: string;
  blockData: any;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
}) {
  const audioProperties = blockData.properties;

  return (
    <>
      <AudioUploadToolbarItem
        blockId={blockId}
        disabled={disabled}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.audioUrl', url);
        }}
      />
      <AudioRecordToolbarItem
        blockId={blockId}
        disabled={disabled}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.audioUrl', url);
        }}
      />
      <AudioDownloadToolbarItem
        audioUrl={audioProperties.audioUrl}
        title={audioProperties.title}
        disabled={disabled || !audioProperties.audioUrl}
      />
    </>
  );
}
