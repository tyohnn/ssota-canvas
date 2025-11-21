/**
 * Editor Panel Header
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronsRight,
  Expand,
  Minimize2,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEditorPanelContext } from '../core/context';

export function Header() {
  const { onClose, isExpanded, setIsExpanded } = useEditorPanelContext();
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="shrink-0 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95 group"
                onClick={onClose}
                aria-label="Close editor panel"
              >
                <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close panel</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                <div className="relative w-4 h-4">
                  <Expand
                    className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                      isExpanded
                        ? 'opacity-0 rotate-90 scale-50'
                        : 'opacity-100 rotate-0 scale-100'
                    }`}
                  />
                  <Minimize2
                    className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                      isExpanded
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 -rotate-90 scale-50'
                    }`}
                  />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isExpanded ? 'Collapse panel (ESC)' : 'Expand panel'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Share block</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Share Block</h4>
                  <p className="text-sm text-muted-foreground">
                    Share functionality is being prepared and will be available
                    soon.
                  </p>
                </div>
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    🚧 Preparing...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This feature is under development
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95"
                onClick={() => {
                  console.log('More options');
                }}
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
