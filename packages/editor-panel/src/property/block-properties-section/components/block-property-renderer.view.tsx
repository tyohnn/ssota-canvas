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

import { Box } from '@workspace/ui/components/ui/box';

import type { PropertyUIDefinition } from '../../property-input/types';
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
} from '../../property-input';

function formatShortDisplayUrl(url: string, maxLen = 40): string {
  if (!url || url.length <= maxLen) return url;
  const half = Math.floor((maxLen - 3) / 2);
  return `${url.slice(0, half)}...${url.slice(-half)}`;
}

export interface BlockPropertyRendererViewProps {
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: unknown;
  onChange: (newValue: unknown) => void;
  onImmediateChange: (newValue: unknown) => void;
  readOnly: boolean;
  entityData?: unknown;
  onImageUpload?: (file: File) => Promise<string>;
}

export function BlockPropertyRendererView({
  propertyKey,
  propertyDef,
  value,
  onChange,
  onImmediateChange,
  readOnly,
  entityData,
  onImageUpload,
}: BlockPropertyRendererViewProps) {
  const getFieldIcon = () => {
    if (propertyDef.icon) {
      const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[propertyDef.icon];
      if (IconComponent) {
        return <IconComponent className="w-3.5 h-3.5 text-muted-foreground/70" />;
      }
    }
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
          <Box className="text-xs py-1 px-2 text-muted-foreground">
            {propertyDef.defaultDisplay ? propertyDef.defaultDisplay(value) : String(value ?? '-')}
          </Box>
        );
      case 'readonly-datetime':
        return (
          <Box className="text-xs py-1 px-2 text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {propertyDef.defaultDisplay ? propertyDef.defaultDisplay(value) : String(value ?? '-')}
          </Box>
        );
      case 'readonly-profile': {
        const isProfileObject = value && typeof value === 'object' && 'userId' in (value as object);
        const v = value as { profileImageUrl?: string; name?: string } | null;
        const avatarUrl = isProfileObject && v ? (v as { profileImageUrl?: string }).profileImageUrl : null;
        const displayName = propertyDef.defaultDisplay
          ? propertyDef.defaultDisplay(value)
          : isProfileObject && v
            ? (v as { name?: string }).name || '알 수 없음'
            : String(value ?? '-');
        return (
          <Box className="text-xs py-1 px-2 text-muted-foreground flex items-center gap-1.5">
            <Box className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <User className={`h-2.5 w-2.5 ${avatarUrl ? 'hidden' : ''}`} />
            </Box>
            {displayName}
          </Box>
        );
      }
      case 'url':
        if (!value || typeof value !== 'string') {
          return <Box className="text-xs py-1 px-2 text-muted-foreground">-</Box>;
        }
        return (
          <Box className="text-xs py-1 px-2 text-muted-foreground">
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block" title={value}>
              {formatShortDisplayUrl(value)}
            </a>
          </Box>
        );
      default:
        return <Box className="text-xs py-1 px-2 text-muted-foreground">{String(value ?? '-')}</Box>;
    }
  };

  const renderFieldInput = () => {
    if (readOnly) return renderReadonlyField();

    switch (propertyDef.inputType) {
      case 'text':
      case 'textarea':
        return (
          <TextProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} onImmediateChange={v => onImmediateChange(v)} disabled={readOnly} />
        );
      case 'select':
        return <SelectProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'status':
        return <StatusProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'multi-select':
        return <MultiSelectProperty value={value as string[]} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'checkbox':
        return <CheckboxProperty value={value as boolean} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'number':
        return <NumberProperty value={value as string | number} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'url':
        return <UrlProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'email':
        return <EmailProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'phone':
        return <PhoneProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'color':
        return <ColorProperty value={value as string} propertyDef={propertyDef} onChange={v => onChange(v)} disabled={readOnly} />;
      case 'image-upload':
        return onImageUpload ? (
          <ImageUploadProperty
            value={value as string}
            propertyDef={propertyDef}
            onChange={async v => onChange(v)}
            disabled={readOnly}
            onUpload={onImageUpload}
          />
        ) : (
          <Box className="text-xs text-muted-foreground p-2">Image upload not configured</Box>
        );
      default:
        return (
          <Box className="text-xs text-muted-foreground p-2">
            Unknown input type: {propertyDef.inputType}
          </Box>
        );
    }
  };

  return (
    <Box className="grid grid-cols-[auto_1fr] items-center gap-2 py-0.5 px-3 hover:bg-accent/30 transition-colors">
      <Box className="flex items-center gap-1.5 min-w-[120px] select-none py-0.5">
        {getFieldIcon()}
        <span className="text-xs font-medium truncate text-muted-foreground">{propertyDef.label}</span>
      </Box>
      <Box className="flex-1 min-w-0">{renderFieldInput()}</Box>
    </Box>
  );
}
