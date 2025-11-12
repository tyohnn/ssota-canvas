/**
 * Option Sections
 *
 * 필드 타입에 따라 적절한 옵션 관리 섹션을 렌더링합니다.
 */

'use client';

import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { SelectLikeOption } from './components/select-like-option';
import { StatusOption } from './components/status-option';
import { Separator } from '@/components/ui/separator';

export interface OptionSectionsProps {
  type: PropertyType;
}

export function OptionSections({
  type,
}: OptionSectionsProps): React.JSX.Element | null {
  if (type === PropertyType.STATUS) {
    return (
      <>
        <Separator className="my-3" />
        <StatusOption />
      </>
    );
  }

  if (type === PropertyType.SELECT || type === PropertyType.MULTISELECT) {
    return (
      <>
        <Separator className="my-3" />
        <SelectLikeOption />
      </>
    );
  }

  return null;
}
