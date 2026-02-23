'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

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
}

export function PdfToolbar({
  currentPage,
  numPages,
  onPageChange,
  url,
  filename,
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

  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-1',
        'bg-background/80 backdrop-blur-sm border-b border-border px-2 py-1.5 nodrag'
      )}
    >
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrev}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
            <p>Previous page</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1 px-2">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-9 rounded border border-border bg-background px-1 py-0.5 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Page number"
          />
          <span className="text-sm text-muted-foreground">/ {numPages}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={!canNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" hasArrow={false} sideOffset={4}>
            <p>Next page</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownload}
              disabled={!url}
            >
              <Download className="h-4 w-4" />
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
