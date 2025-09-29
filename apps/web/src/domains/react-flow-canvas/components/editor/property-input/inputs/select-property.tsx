'use client';

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Button } from '@workspace/ui/components/ui/button';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@workspace/ui/components/ui/select';
import {
  ShapePolicy,
  type ColorKey,
} from '@/domains/blocks/policy/shape-policy';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';

const getBadgeStyle = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      opt => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyle(color as ColorKey);
  }
  // Fallback for non-policy colors
  return 'bg-gray-100 border-gray-200 text-gray-700';
};

const getBadgeStyleObject = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      opt => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyleObject(color as ColorKey);
  }
  // Fallback for non-policy colors
  return {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#374151',
  };
};

export function SelectProperty({
  data,
  field,
  node,
}: {
  data: string;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const [isEditing, setIsEditing] = useState(false);

  const value = data || '';
  const options = (field.options || []) as Array<{
    label: string;
    value: string;
    color?: string;
  }>;
  const currentOption = options.find(opt => opt.value === value);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleSelectChange = (newValue: string) => {
    setIsEditing(false);
    if (newValue !== value) {
      updateField(node, field.path, newValue);
    }
  };

  const handleSelectOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Select
        value={value}
        onValueChange={handleSelectChange}
        onOpenChange={handleSelectOpenChange}
        open={isEditing}
      >
        <SelectTrigger className="h-7 text-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] border-ring ring-ring/50 ring-[3px]">
          <SelectValue>
            {currentOption ? (
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(currentOption.color || 'gray')}
              >
                <span className="text-xs">{currentOption.label}</span>
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {field.placeholder || 'Select option'}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(option.color || 'gray')}
              >
                <span className="text-xs">{option.label}</span>
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-auto min-h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 cursor-pointer"
      onClick={handleLabelClick}
    >
      {currentOption ? (
        <Badge
          className="gap-1.5 h-5"
          style={getBadgeStyleObject(currentOption.color || 'gray')}
        >
          <span className="text-xs">{currentOption.label}</span>
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {field.placeholder || 'Click to select'}
        </span>
      )}
    </Button>
  );
}
