/**
 * Template Selector Content Component
 * 
 * Visual Summary 템플릿 선택 UI (Popover Content 전용)
 */

'use client';

import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Box } from '@/components/ui/box';
import type { VisualTemplate } from '@/domains/ai-visual-summary/shared/types/template.types';

interface TemplateSelectorContentProps {
  templates: VisualTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (template: VisualTemplate) => void;
}

/**
 * Lucide 아이콘을 동적으로 가져오기
 */
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || null;
}

export function TemplateSelectorContent({
  templates,
  selectedTemplateId,
  onTemplateSelect,
}: TemplateSelectorContentProps) {
  return (
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
              onClick={() => onTemplateSelect(template)}
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
  );
}
