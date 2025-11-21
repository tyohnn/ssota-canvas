'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Trash2, Check } from 'lucide-react';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import {
  ColorToken,
  COLOR_TOKEN_CLASSES,
  COLOR_TOKEN_LABELS,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { useOptionManagementContext } from '../core/context';

interface OptionEditPopoverProps {
  option: PropertyOption;
  isNew?: boolean;
  onClose: () => void;
}

export function OptionEditPopover({
  option,
  isNew = false,
  onClose,
}: OptionEditPopoverProps) {
  const {
    statusGroups: groups,
    handleOptionLabelChange: onLabelChange,
    handleOptionColorChange: onColorChange,
    handleOptionGroupChange: onGroupChange,
    handleDeleteOption: onDelete,
    handleDuplicateOption: onDuplicate,
    handleCreateOption: onCreate,
  } = useOptionManagementContext();
  const [label, setLabel] = useState(option.label);

  // Convert option.color (string) to ColorToken
  const getInitialColor = (): ColorToken => {
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

  const [color, setColor] = useState<ColorToken>(getInitialColor());
  const optionGroup = (option as PropertyOption & { group?: string }).group;
  const [group, setGroup] = useState<string>(
    optionGroup || groups?.[0]?.id || 'not-started'
  );
  const [hasCreated, setHasCreated] = useState(false);

  // Sync group state when option.group changes (for new options)
  useEffect(() => {
    if (isNew && optionGroup) {
      setGroup(optionGroup);
    }
  }, [isNew, optionGroup]);

  // Auto-save label changes for existing options
  useEffect(() => {
    if (label !== option.label && !isNew) {
      onLabelChange(option.id, label);
    }
  }, [label, option.label, option.id, isNew, onLabelChange]);

  // Auto-save color changes for existing options
  useEffect(() => {
    if (color !== getInitialColor() && !isNew) {
      onColorChange(option.id, color);
    }
  }, [color, option.id, isNew, onColorChange]);

  // Auto-save group changes for existing options (Status only)
  useEffect(() => {
    const currentGroup =
      (option as PropertyOption & { group?: string }).group || 'not-started';
    if (group !== currentGroup && !isNew && onGroupChange) {
      onGroupChange(option.id, group);
    }
  }, [group, option.id, isNew, onGroupChange]);

  // For new options, create when color is selected
  const handleColorSelect = (selectedColor: ColorToken) => {
    setColor(selectedColor);
    if (isNew && label.trim() && !hasCreated) {
      setHasCreated(true);
      // For Status, use current group state (user may have changed it)
      // Only pass group if groups are available (Status type)
      const optionGroup = groups && groups.length > 0 ? group : undefined;
      onCreate(label, selectedColor, optionGroup);
      onClose();
    }
  };

  const colorOptions = Object.values(ColorToken);

  const handleDuplicate = () => {
    onDuplicate(option.id);
    onClose();
  };

  const handleDelete = () => {
    onDelete(option.id);
    onClose();
  };

  return (
    <div className="w-full space-y-4">
      {/* Label Input */}
      <div className="space-y-2">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={`option-${option.id}-label`}
        >
          Option Label
        </Label>
        <Input
          id={`option-${option.id}-label`}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Enter option label"
          className="h-7"
        />
      </div>

      {/* Group Selector (Status only) */}
      {groups && groups.length > 0 && (
        <>
          <Separator className="bg-border/50" />
          <div className="space-y-2">
            <Label
              className="text-xs font-medium text-muted-foreground mb-1 select-none"
              htmlFor={`option-${option.id}-group`}
            >
              Group
            </Label>
            <select
              id={`option-${option.id}-group`}
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="w-full h-7 px-2 text-xs border rounded"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <Separator className="bg-border/50" />

      {/* Color Selection */}
      <div className="space-y-2">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={`option-${option.id}-color`}
        >
          Color
        </Label>
        <div className="space-y-0.5">
          {colorOptions.map(colorToken => {
            const isSelected = color === colorToken;
            const colorClasses = COLOR_TOKEN_CLASSES[colorToken];

            return (
              <Button
                key={colorToken}
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 px-2 hover:bg-muted/50 transition-all duration-200 ${
                  isSelected ? 'bg-accent/50' : ''
                }`}
                onClick={() => {
                  if (isNew) {
                    handleColorSelect(colorToken);
                  } else {
                    setColor(colorToken);
                  }
                }}
              >
                <div
                  className={`w-4 h-4 rounded mr-2 transition-transform duration-200 ${
                    colorClasses.background
                  } ${colorClasses.border} border`}
                />
                <span className="text-xs flex-1 text-left">
                  {COLOR_TOKEN_LABELS[colorToken]}
                </span>
                {isSelected && (
                  <Check className="w-3 h-3 text-primary ml-auto" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Actions */}
      {!isNew && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="flex-1 h-7 px-2 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex-1 h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
