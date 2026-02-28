'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import { refreshCanvasAssetAccessUrlAction } from '@/domains/storage/actions/storage.actions';

import { Box } from '@workspace/ui/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PAGE_WIDTH = 200;
const PDF_DEVICE_PIXEL_RATIO = 2;

/** UUID to 8-char hex slug (workspace scoped) */
function uuidToSlug(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}

export interface PdfPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
  blockId?: string;
  workspaceId?: string;
}

function PdfPreviewFallback({
  displayTitle,
  pageCount,
}: {
  displayTitle: string;
  pageCount: number | undefined;
}) {
  return (
    <Box className="flex flex-col h-full min-h-0 p-4 justify-center items-center gap-2">
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

export function PdfPreviewCard({
  title,
  properties,
  blockId,
  workspaceId,
}: PdfPreviewCardProps) {
  const filename = properties.filename as string | undefined;
  const pageCount = properties.pageCount as number | undefined;
  const accessUrl = (properties.accessUrl ?? properties.url) as
    | string
    | undefined;
  const pathUrl = (properties.pathUrl as string | undefined) ?? '';
  const displayTitle = filename || title || 'PDF';

  const [hasError, setHasError] = useState(false);
  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
  const hasTriedRefreshRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(PAGE_WIDTH);

  const displayUrl = refreshedUrl ?? accessUrl;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect?.width) setContainerWidth(Math.max(rect.width, 120));
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || PAGE_WIDTH);
    return () => ro.disconnect();
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

  if (!displayUrl || hasError) {
    return (
      <PdfPreviewFallback displayTitle={displayTitle} pageCount={pageCount} />
    );
  }

  return (
    <Box className="flex flex-col h-full min-h-0">
      <Box
        ref={containerRef}
        className="relative flex-1 min-h-[80px] overflow-hidden bg-muted flex items-start justify-center"
      >
        <Document
          file={displayUrl}
          onLoadError={handleLoadError}
          loading={
            <Box className="flex flex-1 items-center justify-center min-h-[80px]">
              <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
            </Box>
          }
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={1}
            width={containerWidth}
            devicePixelRatio={PDF_DEVICE_PIXEL_RATIO}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <Box className="flex flex-1 items-center justify-center min-h-[80px]">
                <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
              </Box>
            }
            className="shadow-sm"
          />
        </Document>
        <Box
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-card to-transparent"
          aria-hidden
        />
      </Box>
      <Box className="p-2 shrink-0 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground truncate">{displayTitle}</p>
        {pageCount != null && (
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
          </p>
        )}
      </Box>
    </Box>
  );
}
