'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Separator } from '@workspace/ui/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';

import {
  Plus,
  Type,
  Hash,
  List,
  ListChecks,
  Star,
  Square,
  Palette,
  Calendar,
  CheckSquare,
  Link,
  FileText,
  Mail,
  Phone,
  EyeOff,
} from 'lucide-react';
import { NodeUI, SchemaField } from '@/domains/blocks/types';
import { SchemaFieldType } from '@/domains/blocks/types/common.node';
import { createUniqueFieldId } from '@/lib/regex';
import {
  extractUserDefinedSchema,
  generateDefaultSchemaFieldByType,
  getDefaultValueByFieldType,
} from '@/domains/react-flow-canvas/policy/node-form-schema-policy';
import { useReactFlowCommandsContext } from '@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext';
import { useReactFlowNodeSelection } from '@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext';

type PropertyAddPopoverProps = {
  pathSection: 'formData' | 'nodeUI';
};

const FIELD_TYPES: {
  type: SchemaFieldType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
  { type: 'select', label: 'Select', icon: <List className="w-4 h-4" /> },
  {
    type: 'multi-select',
    label: 'Multi Select',
    icon: <ListChecks className="w-4 h-4" />,
  },
  { type: 'status', label: 'Status', icon: <Star className="w-4 h-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className="w-4 h-4" />,
  },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'file', label: 'File', icon: <FileText className="w-4 h-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { type: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
];

export function PropertyAddPopover({ pathSection }: PropertyAddPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const labelInputRef = React.useRef<HTMLInputElement>(null);
  const { nodeCommands } = useReactFlowCommandsContext();
  const { selectedSingleNodeData } = useReactFlowNodeSelection();

  const handleAdd = async (type: SchemaFieldType) => {
    if (!selectedSingleNodeData) return;

    if (!label.trim()) {
      labelInputRef.current?.focus();
      return;
    }

    // 기본 SchemaField 생성
    const baseField = generateDefaultSchemaFieldByType(
      type,
      label,
      pathSection
    );

    if (pathSection === 'formData') {
      // Property Section: formData와 formSchema 업데이트
      const currentFormData =
        (selectedSingleNodeData.data.formData as Record<string, unknown>) || {};
      const currentSchema = (selectedSingleNodeData.data.formSchema as any) || {
        fields: [],
      };

      // 기존 필드 ID들을 추출하여 중복 확인
      const existingFieldIds = (currentSchema.fields || []).map(
        (field: SchemaField) => field.id
      );

      // 고유한 필드 ID 생성
      const uniqueFieldId = createUniqueFieldId(label, existingFieldIds);

      // 고유한 ID로 baseField 업데이트
      const updatedBaseField = {
        ...baseField,
        id: uniqueFieldId,
        path: [baseField.path[0], uniqueFieldId],
      };

      // 새로운 필드를 formSchema에 추가
      const updatedSchema = {
        ...currentSchema,
        fields: [...(currentSchema.fields || []), updatedBaseField],
      };

      // 필드 타입에 따른 기본값 설정
      const defaultValue = getDefaultValueByFieldType(
        updatedBaseField.type,
        updatedBaseField.options
      );

      // formSchema와 formData 동시 업데이트
      const result = await nodeCommands.updateNodeData(selectedSingleNodeData, {
        formSchema: updatedSchema,
        formData: {
          ...currentFormData,
          [updatedBaseField.id]: defaultValue,
        },
      });

      if (!result.ok) {
        console.error('Failed to add new form field:', result.error);
      }
    } else if (pathSection === 'nodeUI') {
      // Style Section: nodeUI 업데이트
      const currentNodeUI =
        (selectedSingleNodeData.data.nodeUI as NodeUI) || {};

      // 필드 타입에 따른 기본값 설정
      const defaultValue = getDefaultValueByFieldType(
        baseField.type,
        baseField.options
      );

      // nodeUI 업데이트
      const result = await nodeCommands.updateNodeData(selectedSingleNodeData, {
        nodeUI: {
          ...currentNodeUI,
          [baseField.id]: defaultValue,
        },
      });

      if (!result.ok) {
        console.error('Failed to add new style field:', result.error);
      }
    }

    setOpen(false);
    setLabel('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <div className="p-3 space-y-3">
          <Input
            ref={labelInputRef}
            value={label}
            onChange={e => setLabel(e.currentTarget.value)}
            placeholder="Enter field label"
          />

          {/* <Separator className="border-border"/> */}

          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map(ft => (
              <button
                key={ft.type}
                type="button"
                className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm hover:bg-accent/50 hover:text-accent-foreground"
                onClick={() => handleAdd(ft.type)}
              >
                <span className="shrink-0 text-muted-foreground">
                  {ft.icon}
                </span>
                <span className="truncate">{ft.label}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PropertyAddPopover;
