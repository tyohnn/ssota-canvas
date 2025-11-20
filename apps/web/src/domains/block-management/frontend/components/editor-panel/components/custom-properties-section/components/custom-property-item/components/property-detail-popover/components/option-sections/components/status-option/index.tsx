/**
 * Status Option
 *
 * 상태 속성의 옵션 관리 (Status Groups 섹션)
 */

'use client';

import { OptionManagementProvider } from '../../core/provider';
import { AddStatusOptionProvider } from './core/provider';
import { SectionHeader } from './components/section-header';
import { StatusGroup } from './components/status-group';
import { EmptyState } from './components/empty-state';
import { useOptionManagementContext } from '../../core/context';

const DEFAULT_STATUS_GROUPS = [
  { id: 'not-started', label: 'Not Started', color: 'gray' },
  { id: 'in-progress', label: 'In Progress', color: 'yellow' },
  { id: 'completed', label: 'Completed', color: 'green' },
];

function StatusGroupsContent() {
  const { statusGroups, options } = useOptionManagementContext();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionHeader />
        {statusGroups?.map(group => (
          <StatusGroup key={group.id} group={group} />
        ))}
      </div>
      {options.length === 0 && <EmptyState />}
    </div>
  );
}

export function StatusOption(): React.JSX.Element {
  return (
    <OptionManagementProvider
      withGroups={true}
      defaultGroups={DEFAULT_STATUS_GROUPS}
    >
      <AddStatusOptionProvider>
        <StatusGroupsContent />
      </AddStatusOptionProvider>
    </OptionManagementProvider>
  );
}
