/**
 * Select Like Option
 *
 * 선택형 속성의 옵션 관리 (Options 섹션)
 */

'use client';

import { OptionManagementProvider } from '../../core/provider';
import { AddOptionProvider } from './core/provider';
import { SectionHeader } from './components/section-header';
import { OptionsList } from './components/options-list';

function SelectLikeOptionsContent() {
  return (
    <div className="space-y-2">
      <SectionHeader />
      <OptionsList />
    </div>
  );
}

export function SelectLikeOption(): React.JSX.Element {
  return (
    <OptionManagementProvider withGroups={false}>
      <AddOptionProvider>
        <SelectLikeOptionsContent />
      </AddOptionProvider>
    </OptionManagementProvider>
  );
}
