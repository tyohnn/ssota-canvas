'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { NodeProps } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@workspace/ui/components/ui/button';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import type { PdfBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import { BaseBlock } from '../base-block';

/**
 * PDF Block Component
 *
 * PDF 문서를 표시하는 블록 컴포넌트
 * - react-pdf (PDF.js 기반) 사용
 * - Chrome, Firefox 등 모든 브라우저에서 사용하는 표준 PDF 엔진
 * - 페이지 수 자동 추출 및 네비게이션 지원
 */
export const PdfBlock = memo(function PdfBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as PdfBlockNodeData;
  const properties = nodeData.properties as PdfBlockProperties;

  // Properties destructuring
  const { url, filename, pageCount, showPageNav, showToolbar } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 300;
  const height = typeof nodeH === 'number' ? nodeH : 400;

  // State (UI 상태 - 서버 저장 불필요)
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  // PDF.js 워커 설정 (공식 권장 방법)
  React.useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }, []);

  // Hooks
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const { upload, isUploading } = useSupabaseStorage();

  // File upload hook
  const maxSizeMB = 50;
  const maxSize = maxSizeMB * 1024 * 1024; // 50MB

  const [
    { files, isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'application/pdf,.pdf',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview && fileWithPreview.file instanceof File) {
        try {
          setIsLoading(true);

          // TODO: Extract PDF metadata (page count)
          // const metadata = await extractPdfMetadata(fileWithPreview.file);

          // Upload to Supabase Storage
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file: fileWithPreview.file,
            orgId: nodeData.orgId,
            workspaceId: nodeData.workspaceId,
            pageId: nodeData.pageId,
            blockId: nodeData.blockId,
          });

          // Update URL and filename
          await updateProperty(
            nodeData.blockId,
            'properties.url',
            result.url,
            nodeData
          );
          await updateProperty(
            nodeData.blockId,
            'properties.filename',
            fileWithPreview.file.name,
            nodeData
          );

          // TODO: Update page count when metadata extraction is implemented
          // await updateProperty(
          //   nodeData.blockId,
          //   'properties.pageCount',
          //   metadata.pageCount,
          //   nodeData
          // );

          setIsLoading(false);
        } catch (error) {
          console.error('Failed to upload PDF:', error);
          setHasError(true);
          setErrorMessage('PDF 업로드 실패');
          setIsLoading(false);

          // Fallback to blob URL
          if (fileWithPreview.preview) {
            await updateProperty(
              nodeData.blockId,
              'properties.url',
              fileWithPreview.preview,
              nodeData
            );
            await updateProperty(
              nodeData.blockId,
              'properties.filename',
              fileWithPreview.file.name,
              nodeData
            );
          }
        }
      }
    },
  });

  // Handlers (로컬 상태만 업데이트 - 서버 저장 불필요)
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    const totalPages = numPages || pageCount || 1;
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [numPages, pageCount]);

  // PDF Document 로드 성공 시 페이지 수 자동 업데이트
  const onDocumentLoadSuccess = useCallback(
    async ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setHasError(false);

      // 페이지 수가 다르면 서버에 업데이트
      if (numPages !== pageCount) {
        await updateProperty(
          nodeData.blockId,
          'properties.pageCount',
          numPages,
          nodeData
        );
      }
    },
    [pageCount, updateProperty, nodeData]
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('PDF 로드 실패');
  }, []);

  // URL 변경 시 currentPage를 1로 리셋
  React.useEffect(() => {
    setCurrentPage(1);
  }, [url]);

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <TooltipProvider>
        <div
          className={cn(
            'w-full h-full flex flex-col relative',
            'bg-background border-2 border-border rounded-lg overflow-hidden',
            'shadow-md',
            !selected && 'hover:shadow-xl hover:rotate-1',
            selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
            selected && 'shadow-xl',
            'transition-all duration-300 ease-out'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* PDF 컨테이너 */}
          <div className="relative flex-1 overflow-hidden bg-muted/30 group">
            {!url ? (
              isUploading ? (
                <Skeleton className="absolute inset-0" />
              ) : (
                <div
                  role="button"
                  onClick={selected ? openFileDialog : undefined}
                  onDragEnter={selected ? handleDragEnter : undefined}
                  onDragLeave={selected ? handleDragLeave : undefined}
                  onDragOver={selected ? handleDragOver : undefined}
                  onDrop={selected ? handleDrop : undefined}
                  data-dragging={isDragging || undefined}
                  className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center',
                    'transition-colors',
                    selected && 'cursor-pointer',
                    selected && 'hover:bg-accent/50',
                    isDragging &&
                      'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload PDF"
                  />
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div
                      className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
                      aria-hidden="true"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {selected
                        ? 'PDF를 드롭하거나 클릭하여 업로드'
                        : 'PDF를 추가하려면 블록을 선택하세요'}
                    </p>
                    {selected && (
                      <p className="text-xs text-muted-foreground">
                        최대 {maxSizeMB}MB
                      </p>
                    )}
                  </div>
                  {uploadErrors.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <span>{uploadErrors[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <>
                {/* PDF 뷰어 영역 */}
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-muted/10 overflow-auto nodrag">
                  <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                          <p className="text-sm text-muted-foreground">
                            PDF 로딩 중...
                          </p>
                        </div>
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-2 text-destructive" />
                        <span className="text-sm font-medium">
                          {errorMessage || 'PDF 로드 실패'}
                        </span>
                      </div>
                    }
                    className="flex items-center justify-center"
                  >
                    <Page
                      pageNumber={currentPage}
                      width={width * zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={
                        <Skeleton
                          className="bg-muted/20"
                          style={{ width: width * zoom, height: height * zoom }}
                        />
                      }
                      className="shadow-lg"
                    />
                  </Document>
                </div>

                {/* 업로드 중 Skeleton Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 페이지 네비게이션 (하단) */}
          {url &&
            showPageNav &&
            (numPages || pageCount) &&
            (numPages || pageCount)! > 1 && (
              <div
                className="px-3 py-2 bg-background border-t border-border flex items-center justify-between"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handlePreviousPage();
                  }}
                  disabled={currentPage <= 1}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs text-muted-foreground">
                  {currentPage} / {numPages || pageCount}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleNextPage();
                  }}
                  disabled={currentPage >= (numPages || pageCount || 1)}
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

          {/* 파일명 표시 (페이지 네비게이션이 없을 때) */}
          {url &&
            filename &&
            (!showPageNav ||
              !(numPages || pageCount) ||
              (numPages || pageCount)! <= 1) && (
              <div className="px-3 py-2 bg-background border-t border-border min-h-[36px] flex items-center justify-center">
                <p className="text-xs text-center text-muted-foreground truncate">
                  {filename}
                </p>
              </div>
            )}
        </div>
      </TooltipProvider>
    </BaseBlock>
  );
});
