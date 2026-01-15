/**
 * Detail Popover
 *
 * 속성 편집 팝오버의 통합 레이아웃
 * - NameInput (공통)
 * - OptionSections (타입별 옵션 관리 섹션)
 * - ActionButtons (공통)
 */

'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { DetailPopoverProvider } from './core/provider';
import { NameInput } from './components/name-input';
import { ActionButtons } from './components/action-buttons';
import { OptionSections } from './components/option-sections/index';
import { Wrapper } from './components/wrapper';
import { useDetailPopoverContext } from './core/context';
import type { DetailPopoverProps } from './core/types';

function DetailPopoverContent(): React.JSX.Element {
  const { handleKeyDown, field } = useDetailPopoverContext();

  return (
    <Wrapper tabIndex={-1} onKeyDown={handleKeyDown}>
      <NameInput />
      <OptionSections type={field.type} />
      <Separator className="my-3" />
      <ActionButtons />
    </Wrapper>
  );
}

export function DetailPopover({
  blockId,
  field,
}: DetailPopoverProps): React.JSX.Element {
  return (
    <DetailPopoverProvider blockId={blockId} field={field}>
      <DetailPopoverContent />
    </DetailPopoverProvider>
  );
}
