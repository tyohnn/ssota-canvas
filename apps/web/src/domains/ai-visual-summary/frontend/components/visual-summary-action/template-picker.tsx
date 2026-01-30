/**
 * Template Picker Component
 * 
 * Visual Summary 템플릿을 선택하는 Popover UI
 */

'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Box } from '@/components/ui/box';
import { getAllTemplates } from '../../../templates';
import type { VisualTemplate } from '../../../shared/types/template.types';

interface TemplatePickerProps {
  onTemplateSelect: (template: VisualTemplate) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Lucide 아이콘을 동적으로 가져오기
 */
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || null;
}

export function TemplatePicker({
  onTemplateSelect,
  disabled = false,
  isLoading = false,
}: TemplatePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const templates = getAllTemplates();

  const handleTemplateSelect = (template: VisualTemplate) => {
    setSelectedTemplateId(template.id);
    setIsPopoverOpen(false);
    onTemplateSelect(template);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <ToolbarIconButton
          icon={isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          tooltip={
            isLoading
              ? 'Generating Visual Summary...'
              : disabled
                ? 'Extract summary first'
                : 'Visual Summary'
          }
          tooltipSide="top"
          tooltipOffset={5}
          className="h-7 w-7 p-0"
          iconClassName="size-3.5"
          disabled={disabled || isLoading}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Box className="space-y-1">
          <Box className="px-2 py-1.5 text-sm font-semibold">
            Select Template
          </Box>
          <Box className="max-h-[300px] overflow-y-auto space-y-1">
            {templates.map(template => {
              const IconComponent = getLucideIcon(template.icon);
              const isSelected = selectedTemplateId === template.id;

              return (
                <Box
                  key={template.id}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleTemplateSelect(template)}
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
                  {isSelected && <Check className="h-3 w-3 text-green-600" />}
                </Box>
              );
            })}
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  );
}
