'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

export interface PdfToolbarProps {
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  url: string;
  filename?: string;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

export function PdfToolbar({
  currentPage,
  numPages,
  onPageChange,
  url,
  filename,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: PdfToolbarProps) {
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handlePrev = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setInputValue(String(currentPage - 1));
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
      setInputValue(String(currentPage + 1));
    }
  }, [currentPage, numPages, onPageChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      onPageChange(parsed);
      setInputValue(String(parsed));
    } else {
      setInputValue(String(currentPage));
    }
  }, [inputValue, numPages, currentPage, onPageChange]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    },
    []
  );

  const handleDownload = useCallback(() => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, filename]);

  const canPrev = currentPage > 1;
  const canNext = currentPage < numPages;

  const btnClass =
    'flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const iconClass = 'h-3 w-3';

  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-0.5',
        'bg-background/80 backdrop-blur-sm border-b border-border px-1.5 py-1 nodrag'
      )}
    >
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={btnClass}
              onClick={handlePrev}
              disabled={!canPrev}
            >
              <ChevronLeft className={iconClass} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
            <p>Previous page</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-0.5 px-1">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-7 rounded border border-border bg-background px-0.5 py-px text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Page number"
          />
          <span className="text-xs text-muted-foreground">/ {numPages}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={btnClass}
              onClick={handleNext}
              disabled={!canNext}
            >
              <ChevronRight className={iconClass} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
            <p>Next page</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 확대/축소 - 일단 비표시 */}
      {/* {(onZoomIn != null || onZoomOut != null) && (
        <div className="flex items-center gap-0.5 border-l border-border pl-1.5 ml-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={btnClass}
                onClick={onZoomOut}
                disabled={!canZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className={iconClass} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
              <p>Zoom out</p>
            </TooltipContent>
          </Tooltip>
          <span className="min-w-9 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={btnClass}
                onClick={onZoomIn}
                disabled={!canZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className={iconClass} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
              <p>Zoom in</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )} */}

      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={btnClass}
              onClick={handleDownload}
              disabled={!url}
            >
              <Download className={iconClass} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
            <p>Download</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
