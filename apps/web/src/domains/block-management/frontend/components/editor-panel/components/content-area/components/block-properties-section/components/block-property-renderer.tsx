/**
 * Block Property Renderer
 *
 * 블록의 기본 속성을 UI 스키마 기반으로 렌더링
 */

'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import {
  Calendar,
  CheckSquare,
  FileText,
  Hash,
  Link,
  List,
  Mail,
  Palette,
  Phone,
  Type,
  User,
} from 'lucide-react';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

// Import all input components
import {
  CheckboxProperty,
  ColorProperty,
  EmailProperty,
  ImageUploadProperty,
  MultiSelectProperty,
  NumberProperty,
  PhoneProperty,
  SelectProperty,
  StatusProperty,
  TextProperty,
  UrlProperty,
} from '../../../components/property-input';

export interface BlockPropertyRendererProps {
  blockId: string;
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: any;
  blockData?: any; // 실제 블록 데이터 (blockId 추출용)
}

export function BlockPropertyRenderer({
  blockId,
  propertyKey,
  propertyDef,
  value,
  blockData,
}: BlockPropertyRendererProps) {
  const { getNode, updateNode } = useReactFlow();
  const { readonly: canvasReadonly } = useCanvasReadOnly();
  const { updateProperty, updatePropertyImmediate } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });

  const handleValueChange = useCallback(
    async (newValue: any) => {
      if (canvasReadonly || propertyDef.readonly) {
        return; // 읽기 전용은 수정 불가
      }

      if (!blockData) {
        console.error('blockData is required for property update');
        return;
      }

      try {
        // React Flow 노드 ID 사용 (optimistic update용)
        // 서버 액션에서는 실제 DB blockId 사용
        await updateProperty(
          blockId,
          `properties.${propertyKey}`,
          newValue,
          blockData
        );
      } catch (error) {
        console.error('Failed to update property:', error);
      }
    },
    [
      blockId,
      propertyKey,
      canvasReadonly,
      propertyDef.readonly,
      updateProperty,
      blockData,
    ]
  );

  const handleImmediateUpdate = useCallback(
    (newValue: any) => {
      if (canvasReadonly || propertyDef.readonly) {
        return;
      }

      if (!blockData) {
        console.error('blockData is required for immediate property update');
        return;
      }

      // Immediate React Flow node update only (no server action)
      updatePropertyImmediate(
        blockId,
        `properties.${propertyKey}`,
        newValue,
        blockData
      );
    },
    [
      blockId,
      propertyKey,
      canvasReadonly,
      propertyDef.readonly,
      updatePropertyImmediate,
      blockData,
    ]
  );

  const getFieldIcon = () => {
    // 스키마에서 정의된 아이콘이 있으면 우선 사용
    if (propertyDef.icon) {
      const IconComponent = (LucideIcons as any)[propertyDef.icon];
      if (IconComponent) {
        return (
          <IconComponent className="w-3.5 h-3.5 text-muted-foreground/70" />
        );
      }
    }

    // 스키마 아이콘이 없으면 입력 타입별 기본 아이콘 사용
    switch (propertyDef.inputType) {
      case 'text':
      case 'textarea':
        return <Type className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'select':
      case 'multi-select':
        return <List className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'url':
        return <Link className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'color':
        return <Palette className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'datetime':
      case 'readonly-datetime':
        return <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'profile':
      case 'readonly-profile':
        return <User className="w-3.5 h-3.5 text-muted-foreground/70" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-muted-foreground/70" />;
    }
  };

  const renderFieldInput = () => {
    const isReadonly = canvasReadonly || propertyDef.readonly;
    if (isReadonly) {
      // 읽기 전용 속성 렌더링
      return renderReadonlyField();
    }

    switch (propertyDef.inputType) {
      case 'text':
      case 'textarea':
        return (
          <TextProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            onImmediateChange={handleImmediateUpdate}
            disabled={isReadonly}
          />
        );

      case 'select':
        return (
          <SelectProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'status':
        return (
          <StatusProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'multi-select':
        return (
          <MultiSelectProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'checkbox':
        return (
          <CheckboxProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'number':
        return (
          <NumberProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'url':
        return (
          <UrlProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'email':
        return (
          <EmailProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'phone':
        return (
          <PhoneProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'color':
        return (
          <ColorProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
          />
        );

      case 'image-upload':
        return (
          <ImageUploadProperty
            value={value}
            propertyDef={propertyDef}
            onChange={handleValueChange}
            disabled={isReadonly}
            blockData={blockData}
          />
        );

      default:
        return (
          <div className="text-xs text-muted-foreground p-2">
            Unknown input type: {propertyDef.inputType}
          </div>
        );
    }
  };

  const renderReadonlyField = () => {
    switch (propertyDef.inputType) {
      case 'readonly-text':
        return (
          <div className="text-xs py-1 px-2 text-muted-foreground">
            {propertyDef.defaultDisplay
              ? propertyDef.defaultDisplay(value)
              : value || '-'}
          </div>
        );

      case 'readonly-datetime':
        return (
          <div className="text-xs py-1 px-2 text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {propertyDef.defaultDisplay
              ? propertyDef.defaultDisplay(value)
              : value || '-'}
          </div>
        );

      case 'readonly-profile':
        // value가 CreatedByProfile 객체인지 확인
        const isProfileObject =
          value && typeof value === 'object' && 'userId' in value;
        const avatarUrl = isProfileObject ? value.profileImageUrl : null;
        const displayName = propertyDef.defaultDisplay
          ? propertyDef.defaultDisplay(value)
          : isProfileObject
            ? value.name || '알 수 없음'
            : value || '-';

        return (
          <div className="text-xs py-1 px-2 text-muted-foreground flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    // 아바타 로드 실패 시 기본 아이콘으로 fallback
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove(
                      'hidden'
                    );
                  }}
                />
              ) : null}
              <User className={`h-2.5 w-2.5 ${avatarUrl ? 'hidden' : ''}`} />
            </div>
            {displayName}
          </div>
        );

      default:
        return (
          <div className="text-xs py-1 px-2 text-muted-foreground">
            {value || '-'}
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2 py-0.5 px-3 hover:bg-accent/30 transition-colors">
      {/* Field Icon and Label */}
      <div className="flex items-center gap-1.5 min-w-[120px] select-none py-0.5">
        {getFieldIcon()}
        <span className="text-xs font-medium truncate text-muted-foreground">
          {propertyDef.label}
        </span>
      </div>

      {/* Field Input */}
      <div className="flex-1 min-w-0">{renderFieldInput()}</div>
    </div>
  );
}
