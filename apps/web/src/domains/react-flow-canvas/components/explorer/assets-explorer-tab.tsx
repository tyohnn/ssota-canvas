'use client';

import React from 'react';
import type { Block } from '@/db/schema';
import ExplorerTree from '@/domains/react-flow-canvas/explorer/explorer-tree';
import { useAssetsExplorerTree } from '@/domains/react-flow-canvas/components/explorer/handlers/useAssetsExplorerTree';
import { Button } from '@workspace/ui/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

export function AssetsExplorerTab() {
  const {
    assetBlocks,
    selectedComponentId,
    getId,
    getName,
    getParentId,
    getOrder,
    getType,
    renderFileIcon,
    handleSelect,
  } = useAssetsExplorerTree();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 flex flex-col px-2">
        <div className="flex items-center justify-between my-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Components
          </h3>
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 hover:bg-accent/50 h-6 w-6"
                  title="Add Component"
                  disabled
                >
                  <Plus className="!h-3 !w-3 !text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={4}
                hasArrow={false}
                className="bg-card border-border border text-card-foreground"
              >
                <p className="text-xs font-medium">
                  Add Component (Coming Soon)
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1 min-h-0 z-0 overflow-auto">
          <ExplorerTree<
            Block & { hasPositions?: boolean; positionCount?: number }
          >
            sourceData={assetBlocks}
            getId={getId}
            getName={getName}
            getParentId={getParentId}
            getOrder={getOrder}
            getType={getType}
            renderFileIcon={renderFileIcon}
            rootName="Components"
            selectedId={selectedComponentId || undefined}
            onSelect={handleSelect}
            onMove={async () => {}}
            canDrop={() => false}
            disableFolderStructure={true}
          />
        </div>
        <div className="h-4 shrink-0 w-full" aria-hidden />
      </div>
    </div>
  );
}
