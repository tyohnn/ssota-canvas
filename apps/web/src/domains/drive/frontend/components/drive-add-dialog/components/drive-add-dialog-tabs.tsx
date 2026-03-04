'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';
import type { DriveAddDialogTab, DriveBlockTypeTab } from '../core/types';

const SCROLL_STEP = 120;

interface DriveAddDialogTabsProps {
  tabs: DriveAddDialogTab[];
  activeTab: DriveBlockTypeTab;
  onTabClick: (tab: DriveBlockTypeTab) => void;
  variant?: 'vertical' | 'horizontal';
}

export function DriveAddDialogTabs({
  tabs,
  activeTab,
  onTabClick,
  variant = 'vertical',
}: DriveAddDialogTabsProps) {
  const isHorizontal = variant === 'horizontal';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    if (!isHorizontal) return;
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [isHorizontal, tabs.length, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -SCROLL_STEP : SCROLL_STEP,
      behavior: 'smooth',
    });
  };

  const tabButtons = tabs.map(tab => (
    <button
      key={tab.id}
      type="button"
      onClick={() => onTabClick(tab.id)}
      className={cn(
        'flex items-center gap-2 rounded-md text-sm transition-colors shrink-0',
        isHorizontal
          ? 'px-3 py-1.5'
          : 'w-full px-2 py-1.5 text-left',
        activeTab === tab.id
          ? 'bg-accent text-accent-foreground font-medium'
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      )}
    >
      <tab.icon className="size-4 shrink-0" />
      <span>{tab.label}</span>
    </button>
  ));

  if (isHorizontal) {
    return (
      <Box className="flex min-w-0 flex-col gap-2 overflow-hidden">
        <Box className="shrink-0 px-2 text-sm font-semibold">Resource type</Box>
        <Box className="relative flex w-full min-w-0 items-center gap-0">
          {canScrollLeft && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-0 z-10 h-8 w-7 shrink-0 rounded-md bg-muted/90 shadow-sm hover:bg-muted"
              onClick={() => scroll('left')}
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <Box
            ref={scrollRef}
            className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden py-1 touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <Box className="flex flex-nowrap gap-2 w-max px-1">
              {tabButtons}
            </Box>
          </Box>
          {canScrollRight && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 z-10 h-8 w-7 shrink-0 rounded-md bg-muted/90 shadow-sm hover:bg-muted"
              onClick={() => scroll('right')}
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box className="space-y-1">
      <Box className="mb-2 px-2 text-sm font-semibold">Resource type</Box>
      {tabButtons}
    </Box>
  );
}
