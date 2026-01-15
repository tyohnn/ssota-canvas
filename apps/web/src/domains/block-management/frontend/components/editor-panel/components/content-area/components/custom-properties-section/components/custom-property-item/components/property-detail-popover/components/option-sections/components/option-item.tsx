'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Edit3 } from 'lucide-react';
import { OptionEditPopover } from './option-edit-popover';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import {
  ColorToken,
  COLOR_TOKEN_CLASSES,
} from '@/domains/block-management/shared/types/style-tokens.types';

interface OptionItemProps {
  option: PropertyOption;
}

export function OptionItem({ option }: OptionItemProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Convert option.color (string) to ColorToken
  const getColorToken = (): ColorToken => {
    if (!option.color) return ColorToken.GRAY;
    const colorStr = option.color.toLowerCase();
    const tokenMap: Record<string, ColorToken> = {
      red: ColorToken.RED,
      orange: ColorToken.ORANGE,
      amber: ColorToken.AMBER,
      green: ColorToken.GREEN,
      blue: ColorToken.BLUE,
      purple: ColorToken.PURPLE,
      pink: ColorToken.PINK,
      gray: ColorToken.GRAY,
    };
    return tokenMap[colorStr] || ColorToken.GRAY;
  };

  const colorToken = getColorToken();
  const colorClasses = COLOR_TOKEN_CLASSES[colorToken];

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={`flex items-center justify-between p-1.5 rounded-md transition-colors cursor-pointer group ${
            isPopoverOpen
              ? 'bg-accent/50 text-foreground dark:bg-accent/50'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50'
          }`}
        >
          <Badge
            variant="secondary"
            className={`text-xs h-5 px-2 py-0.5 ${
              colorClasses.background
            } ${colorClasses.text} ${colorClasses.border} border`}
          >
            {option.label}
          </Badge>
          <Edit3
            className={`w-3 h-3 transition-opacity ${
              isPopoverOpen
                ? 'text-foreground opacity-100'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100'
            }`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="w-56 p-2">
        <OptionEditPopover
          option={option}
          onClose={() => setIsPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
