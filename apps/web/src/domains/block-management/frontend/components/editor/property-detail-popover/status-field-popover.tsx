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

export interface StatusFieldPopoverProps {
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
      group?: string;
    }>;
  };
  children?: React.ReactNode;
}

/**
 * 상태 속성 편집 팝오버
 *
 * - Label 입력 필드
 * - Status Groups 섹션 (진행전/진행중/완료)
 * - 그룹별 옵션 관리
 */
export function StatusFieldPopover({
  blockId,
  field,
  children,
}: StatusFieldPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(field.name);
  const [options, setOptions] = useState(field.options || []);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionGroup, setNewOptionGroup] = useState('not-started');
  const [showAddOption, setShowAddOption] = useState(false);

  const { saveLabel, deleteField, duplicateField, commitOptions } =
    useSchemaFieldEditor();

  // Default status groups
  const statusGroups = [
    { id: 'not-started', label: 'Not Started', color: 'gray' },
    { id: 'in-progress', label: 'In Progress', color: 'yellow' },
    { id: 'completed', label: 'Completed', color: 'green' },
  ];

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
      color: statusGroups.find(g => g.id === newOptionGroup)?.color || 'gray',
      order: options.filter(o => o.group === newOptionGroup).length,
      group: newOptionGroup,
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

  const handleOptionGroupChange = async (
    optionId: string,
    newGroup: string
  ) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, group: newGroup } : option
    );
    setOptions(updatedOptions);

    try {
      await commitOptions(blockId, field.id, updatedOptions);
    } catch (error) {
      console.error('Failed to update option group:', error);
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

  const getOptionsByGroup = (groupId: string) => {
    return options.filter(option => option.group === groupId);
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
        className="w-96 p-0"
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

          {/* Status Groups Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Status Groups
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddOption(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>

            {/* Add Option Input */}
            {showAddOption && (
              <div className="space-y-2 p-2 border rounded">
                <Input
                  value={newOptionLabel}
                  onChange={e => setNewOptionLabel(e.target.value)}
                  placeholder="Option name"
                  className="h-8"
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

                <div className="flex gap-2">
                  <select
                    value={newOptionGroup}
                    onChange={e => setNewOptionGroup(e.target.value)}
                    className="flex-1 h-8 px-2 text-xs border rounded"
                  >
                    {statusGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>

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
              </div>
            )}

            {/* Status Groups */}
            <div className="space-y-3">
              {statusGroups.map(group => {
                const groupOptions = getOptionsByGroup(group.id);

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          `bg-${group.color}-500`
                        )}
                      />
                      <span className="text-xs font-medium">{group.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupOptions.length}
                      </Badge>
                    </div>

                    <div className="space-y-1 ml-5">
                      {groupOptions.map(option => (
                        <StatusOptionItem
                          key={option.id}
                          option={option}
                          statusGroups={statusGroups}
                          onLabelChange={newLabel =>
                            handleOptionLabelChange(option.id, newLabel)
                          }
                          onGroupChange={newGroup =>
                            handleOptionGroupChange(option.id, newGroup)
                          }
                          onDelete={() => handleDeleteOption(option.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {options.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No status options added yet
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
 * Status Option Item Component
 */
function StatusOptionItem({
  option,
  statusGroups,
  onLabelChange,
  onGroupChange,
  onDelete,
}: {
  option: {
    id: string;
    label: string;
    color: string;
    order: number;
    group?: string;
  };
  statusGroups: Array<{
    id: string;
    label: string;
    color: string;
  }>;
  onLabelChange: (newLabel: string) => void;
  onGroupChange: (newGroup: string) => void;
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
    <div className="flex items-center gap-2 p-1 border rounded hover:bg-accent">
      {/* Group Selector */}
      <select
        value={option.group || 'not-started'}
        onChange={e => onGroupChange(e.target.value)}
        className="text-xs h-6 px-1 border rounded"
      >
        {statusGroups.map(group => (
          <option key={group.id} value={group.id}>
            {group.label}
          </option>
        ))}
      </select>

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
            className="text-xs hover:bg-accent rounded px-1 py-0.5 w-full text-left"
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
