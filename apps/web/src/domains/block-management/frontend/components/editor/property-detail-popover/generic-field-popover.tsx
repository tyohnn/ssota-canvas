'use client';

import { useState, useEffect } from 'react';
import { useSchemaFieldEditor } from '../../../hooks/use-schema-field-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenericFieldPopoverProps {
  blockId: string;
  field: {
    id: string;
    name: string;
    type: string;
    value?: any;
  };
  children?: React.ReactNode;
}

/**
 * 기본 속성 편집 팝오버
 *
 * - Label 입력 필드 (자동 저장)
 * - Duplicate, Delete 버튼
 * - 중첩 Popover 구조
 */
export function GenericFieldPopover({
  blockId,
  field,
  children,
}: GenericFieldPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(field.name);
  const { saveLabel, deleteField, duplicateField } = useSchemaFieldEditor();

  // Update local state when field name changes
  useEffect(() => {
    setLabel(field.name);
  }, [field.name]);

  // Debounced save function
  useEffect(() => {
    if (label !== field.name) {
      const timeoutId = setTimeout(() => {
        saveLabel(blockId, field.id, label).catch(error => {
          console.error('Failed to save label:', error);
          // Revert on error
          setLabel(field.name);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [label, field.name, blockId, field.id, saveLabel]);

  const handleLabelChange = (value: string) => {
    setLabel(value);
  };

  const handleDuplicate = async () => {
    try {
      await duplicateField(blockId, field.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to duplicate field:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteField(blockId, field.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 px-2">
            {field.name}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0"
        side="right"
        align="center"
        onKeyDown={handleKeyDown}
      >
        <div className="p-3">
          {/* Label Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Property name
            </label>
            <Input
              value={label}
              onChange={e => handleLabelChange(e.target.value)}
              placeholder="Property name"
              className="h-8"
            />
          </div>

          <Separator className="my-3" />

          {/* Action Buttons */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              className="w-full justify-start h-8"
            >
              <Copy className="h-3 w-3 mr-2" />
              Duplicate
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className={cn(
                'w-full justify-start h-8 text-destructive hover:text-destructive',
                'hover:bg-destructive/10'
              )}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
