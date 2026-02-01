/**
 * Mock Template Selector Content Component
 *
 * Landing demo용 Template Selector - Argument Map 하이라이트 지원
 */

'use client';

import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';
import type { VisualTemplate } from '@/domains/ai-actions/shared/types/template.types';
import { StepHighlight } from "../../../../../../../mocks/components/StepHighlight";

interface MockTemplateSelectorContentProps {
  templates: VisualTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (template: VisualTemplate) => void;
  highlightTemplateId?: string | null;
}

/**
 * Lucide 아이콘을 동적으로 가져오기
 */
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || null;
}

export function MockTemplateSelectorContent({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  highlightTemplateId,
}: MockTemplateSelectorContentProps) {
  return (
    <Box className="space-y-1 overflow-visible">
      <Box className="px-2 py-1.5 text-sm font-semibold">
        Select Template
      </Box>
      <Box className="max-h-[300px] overflow-y-auto overflow-x-visible py-2 space-y-1">
        {templates.map(template => {
          const IconComponent = getLucideIcon(template.icon);
          const isSelected = selectedTemplateId === template.id;
          const isHighlighted = highlightTemplateId === template.id;

          return (
            <StepHighlight
              key={template.id}
              isActive={isHighlighted}
              className="block overflow-visible"
              cursorAction={isHighlighted ? "click" : undefined}
              showGlow={false}
            >
              <Box
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm",
                  "hover:bg-accent/50 hover:text-accent-foreground",
                  isHighlighted && "bg-blue-500/10 ring-2 ring-blue-400/50"
                )}
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
            </StepHighlight>
          );
        })}
      </Box>
    </Box>
  );
}
