'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Button } from '@workspace/ui/components/ui/button';
import { Badge } from '@workspace/ui/components/ui/badge';
import { Separator } from '@workspace/ui/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { Plus, Trash2, Copy, Edit3, Check } from 'lucide-react';
import { SchemaField, SchemaFieldOption } from '@/domains/blocks/types';
import { createShortId } from '@/lib/regex';
import { useSchemaFieldEditor } from './useSchemaFieldEditor';
import {
  ShapePolicy,
  type ColorKey,
} from '@/domains/blocks/policy/shape-policy';
import { Node } from '@xyflow/react';

// Status groups with default options
const statusGroups = {
  todo: {
    label: 'To Do',
    color: 'bg-gray-100 border-gray-300 text-gray-900',
    dotColor: 'bg-gray-500',
    defaultOptions: [{ label: 'Draft', value: 'draft' }],
  },
  inProgress: {
    label: 'In Progress',
    color: 'bg-blue-100 border-blue-300 text-blue-900',
    dotColor: 'bg-blue-500',
    defaultOptions: [{ label: 'In Progress', value: 'in_progress' }],
  },
  done: {
    label: 'Complete',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    dotColor: 'bg-emerald-500',
    defaultOptions: [{ label: 'Complete', value: 'complete' }],
  },
};

// Shared Popover Content Component
function OptionEditPopoverContent({
  name,
  option,
  onUpdate,
  onDelete,
  onClose,
  isNew = false,
  onDuplicate,
}: {
  name: string;
  option: SchemaFieldOption;
  onUpdate: (updates: Partial<SchemaFieldOption>) => void;
  onDelete: () => void;
  onClose: () => void;
  isNew?: boolean;
  onDuplicate: (option: SchemaFieldOption) => void;
}) {
  const [label, setLabel] = useState(option.label);
  const [color, setColor] = useState(option.color || 'gray');

  // Auto-save label changes
  useEffect(() => {
    if (label !== option.label) {
      onUpdate({ label });
    }
  }, [label, option.label, onUpdate]);

  // Auto-save color changes
  useEffect(() => {
    if (color !== option.color) {
      onUpdate({ color });
    }
  }, [color, option.color, onUpdate]);

  const colorOptions = ShapePolicy.getColorOptions();

  return (
    <div className="w-full space-y-4">
      {/* Label Input */}
      <div className="space-y-2">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={name}
        >
          Option Label
        </Label>
        <Input
          name={name}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Enter option label"
          className="h-7"
        />
      </div>

      <Separator className="bg-border/50" />

      {/* Color Selection */}
      <div className="space-y-2">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={name}
        >
          Color
        </Label>
        <div className="space-y-0.5">
          {colorOptions.map(colorOpt => {
            const isSelected = color === colorOpt.value;
            const colorDef = ShapePolicy.getColorDefinition(
              colorOpt.value as ColorKey
            );
            return (
              <Button
                key={colorOpt.value}
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 px-2 hover:bg-muted/50 transition-all duration-200 ${
                  isSelected ? 'bg-accent/50' : ''
                }`}
                onClick={() => setColor(colorOpt.value)}
              >
                <div
                  className="w-4 h-4 rounded mr-2 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    backgroundColor: colorDef.badge.bg,
                    border: `1px solid ${colorDef.badge.border}`,
                  }}
                />
                <span className="text-xs flex-1 text-left">
                  {colorOpt.label}
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
      <div className="flex gap-2">
        {!isNew && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(option)}
              className="flex-1 h-7 px-2 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex-1 h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function StatusFieldPopover({
  node,
  field,
}: {
  node: Node;
  field: SchemaField;
}) {
  const { saveLabel, deleteField, duplicateField, commitOptions } =
    useSchemaFieldEditor({ node, field });

  const [label, setLabel] = useState(field.label || '');
  const [options, setOptions] = useState<SchemaFieldOption[]>(
    field.options || []
  );
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null
  );
  const [addingOptionGroup, setAddingOptionGroup] = useState<string | null>(
    null
  );
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);

  // Auto-save label changes
  useEffect(() => {
    if (label !== field.label) {
      saveLabel(label);
    }
  }, [label, field.label, saveLabel]);

  // Handle clicking outside input area to cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Element)
      ) {
        setAddingOptionGroup(null);
        setNewOptionLabel('');
      }
    };

    if (addingOptionGroup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [addingOptionGroup]);

  const handleDelete = async () => {
    await deleteField();
  };

  const handleDuplicate = async () => {
    await duplicateField({ label: label || field.label, options });
  };

  const addOption = (group: string) => {
    setAddingOptionGroup(group);
    setNewOptionLabel('');
  };

  const handleNewOptionInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newOptionLabel.trim() && addingOptionGroup) {
      createNewOption(addingOptionGroup);
    } else if (e.key === 'Escape') {
      setAddingOptionGroup(null);
      setNewOptionLabel('');
    }
  };

  const createNewOption = (group: string) => {
    const newOption: SchemaFieldOption = {
      label: newOptionLabel,
      value: createShortId(),
      color: 'gray',
      group: group,
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    commitOptions(newOptions);
    setAddingOptionGroup(null);
    setNewOptionLabel('');
  };

  const duplicateOption = (optionToDuplicate: SchemaFieldOption) => {
    const duplicatedOption: SchemaFieldOption = {
      ...optionToDuplicate,
      label: `${optionToDuplicate.label} Copy`,
      value: createShortId(),
    };
    const newOptions = [...options, duplicatedOption];
    setOptions(newOptions);
    commitOptions(newOptions);
  };

  const updateOption = (index: number, updates: Partial<SchemaFieldOption>) => {
    const newOptions = [...options];
    if (newOptions[index]) {
      newOptions[index] = { ...newOptions[index], ...updates };
      setOptions(newOptions);
      commitOptions(newOptions);
    }
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    commitOptions(newOptions);
  };

  // Group options by their group property
  const groupedOptions = {
    todo: options.filter(opt => opt.group === 'todo'),
    inProgress: options.filter(opt => opt.group === 'inProgress'),
    done: options.filter(opt => opt.group === 'done'),
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={field.id}
        >
          Label
        </Label>
        <Input
          name={field.id}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Enter field label"
          className="h-7"
        />
      </div>

      <Separator className="bg-border/50" />

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground mb-1 select-none">
          Status Options
        </Label>

        {/* Todo Group */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              {statusGroups.todo.label}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addOption('todo')}
              className="p-0 hover:bg-accent/50 h-6 w-6"
            >
              <Plus className="!h-3 !w-3 !text-muted-foreground" />
            </Button>
          </div>

          {/* New Option Input for Todo */}
          {addingOptionGroup === 'todo' && (
            <div ref={inputRef} className="space-y-2">
              <Input
                value={newOptionLabel}
                onChange={e => setNewOptionLabel(e.target.value)}
                placeholder="Enter option label and press Enter"
                className="h-7"
                onKeyDown={handleNewOptionInput}
                autoFocus
              />
            </div>
          )}

          {/* Todo Options */}
          <div className="space-y-1">
            {groupedOptions.todo.map((option, index) => {
              const actualIndex = options.findIndex(opt => opt === option);
              return (
                <Popover
                  key={`todo-${index}`}
                  open={editingOptionIndex === actualIndex}
                  onOpenChange={open =>
                    open
                      ? setEditingOptionIndex(actualIndex)
                      : setEditingOptionIndex(null)
                  }
                >
                  <PopoverTrigger asChild>
                    <div
                      className={`flex items-center justify-between p-1.5 rounded-md transition-colors cursor-pointer group ${
                        editingOptionIndex === actualIndex
                          ? 'bg-accent/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Badge
                        variant="secondary"
                        className={`text-xs h-5 px-2 py-0.5 ${
                          option.color
                            ? `${ShapePolicy.getTailwindBgColor(option.color as ColorKey)} ${ShapePolicy.getTailwindBorderColor(option.color as ColorKey)} ${ShapePolicy.getTailwindTextColor(option.color as ColorKey)}`
                            : ''
                        }`}
                      >
                        {option.label}
                      </Badge>
                      <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="right"
                    className="w-56 p-2"
                  >
                    <OptionEditPopoverContent
                      name={field.id + '-option-' + actualIndex}
                      option={option}
                      onUpdate={updates => updateOption(actualIndex, updates)}
                      onDelete={() => removeOption(actualIndex)}
                      onClose={() => setEditingOptionIndex(null)}
                      onDuplicate={duplicateOption}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>

        {/* In Progress Group */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              {statusGroups.inProgress.label}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addOption('inProgress')}
              className="p-0 hover:bg-accent/50 h-6 w-6"
            >
              <Plus className="!h-3 !w-3 !text-muted-foreground" />
            </Button>
          </div>

          {/* New Option Input for In Progress */}
          {addingOptionGroup === 'inProgress' && (
            <div ref={inputRef} className="space-y-2">
              <Input
                value={newOptionLabel}
                onChange={e => setNewOptionLabel(e.target.value)}
                placeholder="Enter option label and press Enter"
                className="h-7"
                onKeyDown={handleNewOptionInput}
                autoFocus
              />
            </div>
          )}

          {/* In Progress Options */}
          <div className="space-y-1">
            {groupedOptions.inProgress.map((option, index) => {
              const actualIndex = options.findIndex(opt => opt === option);
              return (
                <Popover
                  key={`inProgress-${index}`}
                  open={editingOptionIndex === actualIndex}
                  onOpenChange={open =>
                    open
                      ? setEditingOptionIndex(actualIndex)
                      : setEditingOptionIndex(null)
                  }
                >
                  <PopoverTrigger asChild>
                    <div
                      className={`flex items-center justify-between p-1.5 rounded-md transition-colors cursor-pointer group ${
                        editingOptionIndex === actualIndex
                          ? 'bg-accent/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Badge
                        variant="secondary"
                        className={`text-xs h-5 px-2 py-0.5 ${
                          option.color
                            ? `${ShapePolicy.getTailwindBgColor(option.color as ColorKey)} ${ShapePolicy.getTailwindBorderColor(option.color as ColorKey)} ${ShapePolicy.getTailwindTextColor(option.color as ColorKey)}`
                            : ''
                        }`}
                      >
                        {option.label}
                      </Badge>
                      <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="right"
                    className="w-56 p-2"
                  >
                    <OptionEditPopoverContent
                      name={field.id + '-option-' + actualIndex}
                      option={option}
                      onUpdate={updates => updateOption(actualIndex, updates)}
                      onDelete={() => removeOption(actualIndex)}
                      onClose={() => setEditingOptionIndex(null)}
                      onDuplicate={duplicateOption}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>

        {/* Done Group */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              {statusGroups.done.label}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addOption('done')}
              className="p-0 hover:bg-accent/50 h-6 w-6"
            >
              <Plus className="!h-3 !w-3 !text-muted-foreground" />
            </Button>
          </div>

          {/* New Option Input for Done */}
          {addingOptionGroup === 'done' && (
            <div ref={inputRef} className="space-y-2">
              <Input
                value={newOptionLabel}
                onChange={e => setNewOptionLabel(e.target.value)}
                placeholder="Enter option label and press Enter"
                className="h-7"
                onKeyDown={handleNewOptionInput}
                autoFocus
              />
            </div>
          )}

          {/* Done Options */}
          <div className="space-y-1">
            {groupedOptions.done.map((option, index) => {
              const actualIndex = options.findIndex(opt => opt === option);
              return (
                <Popover
                  key={`done-${index}`}
                  open={editingOptionIndex === actualIndex}
                  onOpenChange={open =>
                    open
                      ? setEditingOptionIndex(actualIndex)
                      : setEditingOptionIndex(null)
                  }
                >
                  <PopoverTrigger asChild>
                    <div
                      className={`flex items-center justify-between p-1.5 rounded-md transition-colors cursor-pointer group ${
                        editingOptionIndex === actualIndex
                          ? 'bg-accent/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Badge
                        variant="secondary"
                        className={`text-xs h-5 px-2 py-0.5 ${
                          option.color
                            ? `${ShapePolicy.getTailwindBgColor(option.color as ColorKey)} ${ShapePolicy.getTailwindBorderColor(option.color as ColorKey)} ${ShapePolicy.getTailwindTextColor(option.color as ColorKey)}`
                            : ''
                        }`}
                      >
                        {option.label}
                      </Badge>
                      <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="right"
                    className="w-56 p-2"
                  >
                    <OptionEditPopoverContent
                      name={field.id + '-option-' + actualIndex}
                      option={option}
                      onUpdate={updates => updateOption(actualIndex, updates)}
                      onDelete={() => removeOption(actualIndex)}
                      onClose={() => setEditingOptionIndex(null)}
                      onDuplicate={duplicateOption}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="bg-border/50" />

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
    </div>
  );
}
