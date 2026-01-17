import React from 'react';

import { DownloadPdfToolbarItem } from './components/download-pdf-toolbar-item';
import { ExpandPdfToolbarItem } from './components/expand-pdf-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function PdfToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: any;
  disabled: boolean;
}) {
  const pdfProperties = blockData.properties;

  return (
    <>
      <ExpandPdfToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        pdfUrl={pdfProperties.url}
        filename={pdfProperties.filename}
        disabled={disabled || !pdfProperties.url}
      />
      <DownloadPdfToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        pdfUrl={pdfProperties.url}
        filename={pdfProperties.filename}
        disabled={disabled || !pdfProperties.url}
      />
    </>
  );
}
