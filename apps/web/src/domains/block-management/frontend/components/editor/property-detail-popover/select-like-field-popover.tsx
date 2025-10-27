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
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectLikeFieldPopoverProps {
  blockId: string;
  field: {
    id: string;
    name: string;
    type: string;
    options?: Array<{
      id: string;
      label: string;
      color: string;
      order: number;
    }>;
  };
  children?: React.ReactNode;
}

/**
 * 선택형 속성 편집 팝오버
 *
 * - Label 입력 필드
 * - Options 섹션 (옵션 목록, 추가 버튼)
 * - 중첩 OptionEditPopover
 */
export function SelectLikeFieldPopover({
  blockId,
  field,
  children,
}: SelectLikeFieldPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(field.name);
  const [options, setOptions] = useState(field.options || []);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);

  const { saveLabel, deleteField, duplicateField, commitOptions } =
    useSchemaFieldEditor();

  // Update local state when field changes
  useEffect(() => {
    setLabel(field.name);
    setOptions(field.options || []);
  }, [field.name, field.options]);

  // Debounced save function for label
  useEffect(() => {
    if (label !== field.name) {
      const timeoutId = setTimeout(() => {
        saveLabel(blockId, field.id, label).catch(error => {
          console.error('Failed to save label:', error);
          setLabel(field.name);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [label, field.name, blockId, field.id, saveLabel]);

  const handleLabelChange = (value: string) => {
    setLabel(value);
  };

  const handleAddOption = async () => {
    if (!newOptionLabel.trim()) return;

    const newOption = {
      id: `opt-${Date.now()}`,
      label: newOptionLabel.trim(),
      color: 'blue',
      order: options.length,
    };

    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    setNewOptionLabel('');
    setShowAddOption(false);

    try {
      await commitOptions(blockId, field.id, updatedOptions);
    } catch (error) {
      console.error('Failed to add option:', error);
      setOptions(options); // Revert on error
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    const updatedOptions = options.filter(option => option.id !== optionId);
    setOptions(updatedOptions);

    try {
      await commitOptions(blockId, field.id, updatedOptions);
    } catch (error) {
      console.error('Failed to delete option:', error);
      setOptions(options); // Revert on error
    }
  };

  const handleOptionLabelChange = async (
    optionId: string,
    newLabel: string
  ) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, label: newLabel } : option
    );
    setOptions(updatedOptions);

    try {
      await commitOptions(blockId, field.id, updatedOptions);
    } catch (error) {
      console.error('Failed to update option:', error);
      setOptions(options); // Revert on error
    }
  };

  const handleOptionColorChange = async (
    optionId: string,
    newColor: string
  ) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, color: newColor } : option
    );
    setOptions(updatedOptions);

    try {
      await commitOptions(blockId, field.id, updatedOptions);
    } catch (error) {
      console.error('Failed to update option color:', error);
      setOptions(options); // Revert on error
    }
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

  const colorOptions = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
  ];

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
        className="w-80 p-0"
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

          {/* Options Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Options
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddOption(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {/* Add Option Input */}
            {showAddOption && (
              <div className="flex gap-2">
                <Input
                  value={newOptionLabel}
                  onChange={e => setNewOptionLabel(e.target.value)}
                  placeholder="Option name"
                  className="h-8 flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddOption();
                    } else if (e.key === 'Escape') {
                      setShowAddOption(false);
                      setNewOptionLabel('');
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-8 px-2"
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddOption(false);
                    setNewOptionLabel('');
                  }}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {options.map(option => (
                <OptionEditItem
                  key={option.id}
                  option={option}
                  colorOptions={colorOptions}
                  onLabelChange={newLabel =>
                    handleOptionLabelChange(option.id, newLabel)
                  }
                  onColorChange={newColor =>
                    handleOptionColorChange(option.id, newColor)
                  }
                  onDelete={() => handleDeleteOption(option.id)}
                />
              ))}
            </div>

            {options.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No options added yet
              </p>
            )}
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

/**
 * Option Edit Item Component
 */
function OptionEditItem({
  option,
  colorOptions,
  onLabelChange,
  onColorChange,
  onDelete,
}: {
  option: {
    id: string;
    label: string;
    color: string;
    order: number;
  };
  colorOptions: string[];
  onLabelChange: (newLabel: string) => void;
  onColorChange: (newColor: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(option.label);

  const handleLabelSubmit = () => {
    if (label.trim() && label !== option.label) {
      onLabelChange(label.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setLabel(option.label);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded hover:bg-accent">
      {/* Color Selector */}
      <div className="flex gap-1">
        {colorOptions.map(color => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              'w-4 h-4 rounded-full border-2',
              `bg-${color}-500`,
              option.color === color && 'ring-2 ring-offset-1 ring-primary'
            )}
            title={color}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex-1">
        {isEditing ? (
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm hover:bg-accent rounded px-1 py-0.5 w-full text-left"
          >
            {option.label}
          </button>
        )}
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-6 w-6 p-0 hover:bg-destructive/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
