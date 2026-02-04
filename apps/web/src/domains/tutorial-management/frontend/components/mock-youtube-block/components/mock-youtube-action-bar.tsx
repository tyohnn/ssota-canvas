'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { cn } from '@workspace/ui/lib/utils';
import { BlockActionBarView } from '@/domains/block-management/frontend/components/block/block-action-bar/block-action-bar.view';
import { getAllTemplates } from '@/domains/ai-actions/backend/prompt/visual-summary';
import type { VisualTemplate } from '@/domains/ai-actions/shared/types/template.types';
import { InteractionGuard } from '../../common/interaction-guard';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return IconComponent ?? null;
}

/**
 * Tutorial mock action bar for YouTube block. Visual Summary button and
 * template selector with second template targetable as template-item-2.
 */
export function MockYoutubeActionBar() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { updateTutorialState } = useTutorialDialogContext();
  const templates = getAllTemplates();

  const handleTemplateSelect = (template: VisualTemplate, index: number) => {
    if (index === 1) {
      updateTutorialState({
        selectedTemplateId: template.id,
        visualSummaryPopoverOpen: false,
      });
    }
    setPopoverOpen(false);
  };

  return (
    <BlockActionBarView show={true}>
      <InteractionGuard selector="visual-summary-button">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Box>
              <ToolbarIconButton
                icon={<Sparkles />}
                tooltip="Generate Visual Summary"
                tooltipSide="top"
                tooltipOffset={5}
                aria-label="Generate Visual Summary"
                disabled={false}
              />
            </Box>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-[300px] p-2 overflow-visible"
          >
            <Box className="space-y-1 overflow-visible">
              <Box className="px-2 py-1.5 text-sm font-semibold">
                Select Template
              </Box>
              <Box className="max-h-[300px] overflow-y-auto overflow-x-visible py-2 space-y-1">
                {templates.map((template, index) => {
                  const IconComponent = getLucideIcon(template.icon);
                  const selector = `template-item-${index + 1}`;
                  const row = (
                    <Box
                      key={template.id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm',
                        'hover:bg-accent/50 hover:text-accent-foreground'
                      )}
                      onClick={() => handleTemplateSelect(template, index)}
                    >
                      <Box className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        <Box className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </Box>
                      </Box>
                    </Box>
                  );
                  return (
                    <InteractionGuard key={template.id} selector={selector}>
                      <Box data-tutorial={selector}>{row}</Box>
                    </InteractionGuard>
                  );
                })}
              </Box>
            </Box>
          </PopoverContent>
        </Popover>
      </InteractionGuard>
    </BlockActionBarView>
  );
}
