/**
 * Block Property Renderer View
 * 
 * Presentational component for Block Property Renderer
 */

'use client';

import React from 'react';
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

import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';

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

export interface BlockPropertyRendererViewProps {
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: any;
  onChange: (newValue: any) => void;
  onImmediateChange: (newValue: any) => void;
  readOnly: boolean;
  blockData?: any; // For image upload
}

export function BlockPropertyRendererView({
  propertyKey,
  propertyDef,
  value,
  onChange,
  onImmediateChange,
  readOnly,
  blockData,
}: BlockPropertyRendererViewProps) {
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

  const renderFieldInput = () => {
    if (readOnly) {
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
            onChange={onChange}
            onImmediateChange={onImmediateChange}
            disabled={readOnly}
          />
        );

      case 'select':
        return (
          <SelectProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'status':
        return (
          <StatusProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'multi-select':
        return (
          <MultiSelectProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'checkbox':
        return (
          <CheckboxProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'number':
        return (
          <NumberProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'url':
        return (
          <UrlProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'email':
        return (
          <EmailProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'phone':
        return (
          <PhoneProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'color':
        return (
          <ColorProperty
            value={value}
            propertyDef={propertyDef}
            onChange={onChange}
            disabled={readOnly}
          />
        );

      case 'image-upload':
        return (
          <ImageUploadProperty
            value={value}
            propertyDef={propertyDef}
            onChange={async (v) => onChange(v)}
            disabled={readOnly}
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
