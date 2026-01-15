/**
 * Property Type Grid
 *
 * 속성 타입 선택 버튼들을 렌더링하는 컴포넌트
 */

'use client';

import React from 'react';
import {
  Type,
  Hash,
  List,
  ListChecks,
  Star,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Palette,
} from 'lucide-react';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { TypeGridItem } from './type-grid-item';
import { Box } from '@/components/ui/box';

export interface TypeGridOption {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
}

export const FIELD_TYPE_OPTIONS: TypeGridOption[] = [
  {
    type: PropertyType.TEXT,
    label: 'Text',
    icon: <Type className="w-4 h-4" />,
  },
  {
    type: PropertyType.NUMBER,
    label: 'Number',
    icon: <Hash className="w-4 h-4" />,
  },
  {
    type: PropertyType.SELECT,
    label: 'Select',
    icon: <List className="w-4 h-4" />,
  },
  {
    type: PropertyType.MULTISELECT,
    label: 'Multi Select',
    icon: <ListChecks className="w-4 h-4" />,
  },
  {
    type: PropertyType.STATUS,
    label: 'Status',
    icon: <Star className="w-4 h-4" />,
  },
  {
    type: PropertyType.DATE,
    label: 'Date',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    type: PropertyType.BOOLEAN,
    label: 'Checkbox',
    icon: <CheckSquare className="w-4 h-4" />,
  },
  { type: PropertyType.URL, label: 'URL', icon: <Link className="w-4 h-4" /> },
  {
    type: PropertyType.EMAIL,
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
  },
  {
    type: PropertyType.PHONE,
    label: 'Phone',
    icon: <Phone className="w-4 h-4" />,
  },
  {
    type: PropertyType.COLOR,
    label: 'Color',
    icon: <Palette className="w-4 h-4" />,
  },
];

export function TypeGrid() {
  return (
    <Box className="grid grid-cols-2 gap-2">
      {FIELD_TYPE_OPTIONS.map(({ type, label, icon }) => (
        <TypeGridItem key={type} type={type} label={label} icon={icon} />
      ))}
    </Box>
  );
}
