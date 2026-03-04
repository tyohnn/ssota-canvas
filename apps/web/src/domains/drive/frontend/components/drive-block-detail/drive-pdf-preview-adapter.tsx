'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import { refreshCanvasAssetAccessUrlAction } from '@/domains/storage/actions/storage.actions';

import { Box } from '@workspace/ui/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { cn } from '@workspace/ui/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/** UUID to 8-char hex slug (workspace scoped) */
function uuidToSlug(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}

export interface DrivePdfPreviewAdapterProps {
  title: string | null;
  properties: Record<string, unknown>;
  blockId: string;
  workspaceId: string;
}

function PdfPreviewFallback({
  displayTitle,
  pageCount,
}: {
  displayTitle: string;
  pageCount: number | undefined;
}) {
  return (
    <Box className="flex flex-col h-full min-h-[400px] justify-center items-center gap-2 p-4">
      <FileText className="w-12 h-12 shrink-0 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground truncate w-full text-center">
        {displayTitle}
      </h3>
      {pageCount != null && (
        <p className="text-xs text-muted-foreground">
          {pageCount} page{pageCount !== 1 ? 's' : ''}
        </p>
      )}
    </Box>
  );
}

/**
 * Drive detail left preview: PDF viewer with page navigation (same UX as add dialog).
 */
export function DrivePdfPreviewAdapter({
  title,
  properties,
  blockId,
  workspaceId,
}: DrivePdfPreviewAdapterProps) {
  const filename = properties.filename as string | undefined;
  const pageCountProp = properties.pageCount as number | undefined;
  const accessUrl = (properties.accessUrl ?? properties.url) as
    | string
    | undefined;
  const pathUrl = (properties.pathUrl as string | undefined) ?? '';
  const displayTitle = filename || title || 'PDF';

  const [hasError, setHasError] = useState(false);
  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
  const hasTriedRefreshRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(280);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const displayUrl = refreshedUrl ?? accessUrl;

  const handleDocumentLoadSuccess = useCallback((params: { numPages: number }) => {
    setNumPages(params.numPages);
    setCurrentPage(1);
  }, []);

  const handleLoadError = useCallback(async () => {
    if (
      hasTriedRefreshRef.current ||
      !pathUrl?.trim() ||
      !blockId ||
      !workspaceId
    ) {
      setHasError(true);
      return;
    }
    hasTriedRefreshRef.current = true;
    try {
      const slug = uuidToSlug(blockId);
      const result = await refreshCanvasAssetAccessUrlAction(
        workspaceId,
        slug,
        'pdf'
      );
      if (result.success && result.url) {
        setRefreshedUrl(result.url);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  }, [pathUrl, blockId, workspaceId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect?.width) setContainerWidth(Math.max(rect.width, 200));
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 280);
    return () => ro.disconnect();
  }, []);

  if (!displayUrl || hasError) {
    return (
      <PdfPreviewFallback displayTitle={displayTitle} pageCount={pageCountProp} />
    );
  }

  return (
    <Box
      ref={containerRef}
      className={cn(
        'relative flex flex-col w-full min-h-[400px] max-h-[400px] rounded-lg border-0 overflow-hidden bg-muted',
        '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
      )}
    >
      <Document
        file={displayUrl}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleLoadError}
        loading={
          <Box className="flex flex-1 items-center justify-center min-h-[200px]">
            <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
          </Box>
        }
        className="flex flex-col flex-1 min-h-0"
      >
        {numPages != null && numPages > 0 && (
          <>
            <Box className="flex shrink-0 items-center justify-center gap-0.5 bg-background/80 backdrop-blur-sm border-b border-border px-1.5 py-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="px-2 text-xs text-muted-foreground tabular-nums">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage(p => Math.min(numPages, p + 1))
                }
                disabled={currentPage >= numPages}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </Box>
            <Box className="flex-1 min-h-0 overflow-auto p-2">
              <Box className="flex justify-center">
                <Page
                  key={currentPage}
                  pageNumber={currentPage}
                  width={Math.max(200, containerWidth - 16)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <Box className="flex items-center justify-center min-h-[200px]">
                      <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
                    </Box>
                  }
                  className="shadow-sm"
                />
              </Box>
            </Box>
          </>
        )}
      </Document>
      <Box
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-card to-transparent"
        aria-hidden
      />
    </Box>
  );
}
