'use client';

import React, { useState } from 'react';

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
 * PDF 뷰어 - 단일 페이지 뷰 + 상단 툴바 (페이지 네비게이션, 다운로드)
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

  const handleLoadSuccess = (params: { numPages: number }) => {
    setNumPages(params.numPages);
    setCurrentPage(1);
    onDocumentLoadSuccess(params);
  };

  const pageWidth = Math.min(width, 600);

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
            />
            <div className="flex flex-1 items-center justify-center overflow-auto pt-10 pb-4">
              <Page
                key={currentPage}
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <Skeleton
                    className="bg-muted/20"
                    style={{ width: pageWidth, height: height * 0.8 }}
                  />
                }
                className="shadow-lg"
              />
            </div>
          </>
        )}
      </Document>
    </div>
  );
}
