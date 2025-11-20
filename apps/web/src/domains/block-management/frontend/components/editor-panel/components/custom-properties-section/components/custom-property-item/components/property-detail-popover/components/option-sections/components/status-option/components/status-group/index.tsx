'use client';

import { GroupHeader } from './group-header';
import { GroupOptionsList } from './group-options-list';
import type { StatusGroup } from '../../types';

interface StatusGroupProps {
  group: StatusGroup;
}

export function StatusGroup({ group }: StatusGroupProps) {
  return (
    <div>
      <GroupHeader group={group} />
      <GroupOptionsList group={group} />
    </div>
  );
}
