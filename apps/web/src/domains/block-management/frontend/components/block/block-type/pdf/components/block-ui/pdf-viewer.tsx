'use client';

import React, { useEffect, useRef, useState } from 'react';

import { AlertCircle, FileText } from 'lucide-react';

import { PdfToolbar } from './pdf-toolbar';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { cn } from '@workspace/ui/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/** 툴바에서 선택 가능한 확대 배율 (1 = 100%) */
export const PDF_ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const MIN_ZOOM = PDF_ZOOM_LEVELS[0];
const MAX_ZOOM = PDF_ZOOM_LEVELS.at(-1) ?? 2;

/** PDF 캔버스 렌더 해상도 (기본 4로 고해상도) */
const PDF_DEVICE_PIXEL_RATIO = 5;

export interface PdfViewerProps {
  url: string;
  filename?: string;
  width: number;
  height: number;
  hasError: boolean;
  errorMessage: string | null;
  onDocumentLoadSuccess: (params: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
}

/**
 * PDF 뷰어 - 단일 페이지 뷰 + 상단 툴바 (페이지 네비게이션, 확대/축소, 다운로드)
 * 화질: devicePixelRatio로 2x 이상 렌더링해 브라우저 내장 뷰어에 가깝게 표시
 */
export function PdfViewer({
  url,
  filename,
  width,
  height,
  hasError,
  errorMessage,
  onDocumentLoadSuccess,
  onDocumentLoadError,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLoadSuccess = (params: { numPages: number }) => {
    setNumPages(params.numPages);
    setCurrentPage(1);
    onDocumentLoadSuccess(params);
  };

  const basePageWidth = Math.min(width, 600);

  const handleZoomIn = () => {
    setZoom((z) => {
      const next = PDF_ZOOM_LEVELS.find((level) => level > z);
      return next ?? MAX_ZOOM;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = [...PDF_ZOOM_LEVELS].reverse().find((level) => level < z);
      return next ?? MIN_ZOOM;
    });
  };

  /** 확대/축소 후 스크롤을 콘텐츠 중앙으로 맞춰 좌우·상하 이동이 가능하도록 함 */
  useEffect(() => {
    if (numPages == null) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        const maxScrollTop = el.scrollHeight - el.clientHeight;
        if (maxScrollLeft > 0) el.scrollLeft = maxScrollLeft / 2;
        if (maxScrollTop > 0) el.scrollTop = maxScrollTop / 2;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [zoom, numPages]);

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col',
        'bg-white dark:bg-muted/10 overflow-auto nodrag'
      )}
    >
      <Document
        file={url}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        }
        error={
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2 text-destructive" />
            <span className="text-sm font-medium">
              {errorMessage || 'Failed to load PDF'}
            </span>
          </div>
        }
        className="flex flex-1 flex-col items-center"
      >
        {numPages != null && numPages > 0 && (
          <>
            <PdfToolbar
              currentPage={currentPage}
              numPages={numPages}
              onPageChange={setCurrentPage}
              url={url}
              filename={filename}
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              canZoomIn={zoom < MAX_ZOOM}
              canZoomOut={zoom > MIN_ZOOM}
            />
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-auto pt-10 pb-4"
            >
              {/* 고정 크기 + shrink 방지로 스크롤 영역이 zoom 크기만큼 잡혀 좌우 스크롤 가능 */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: basePageWidth * zoom,
                  height: basePageWidth * zoom * (297 / 210),
                }}
              >
                <Page
                  key={`${currentPage}-${zoom}`}
                  pageNumber={currentPage}
                  width={basePageWidth}
                  scale={zoom}
                  devicePixelRatio={PDF_DEVICE_PIXEL_RATIO}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <Skeleton
                      className="bg-muted/20"
                      style={{
                        width: basePageWidth * zoom,
                        height: height * 0.8,
                      }}
                    />
                  }
                  className="shadow-lg"
                />
              </div>
            </div>
          </>
        )}
      </Document>
    </div>
  );
}
