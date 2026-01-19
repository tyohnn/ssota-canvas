'use client';

import { useId, useMemo } from 'react';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import type { AllWorkspacesByOrgDTO } from '@/domains/workspace-management/shared/dtos';

interface WorkspaceSelectorProps {
  workspacesByOrg: AllWorkspacesByOrgDTO | null;
  selectedWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
  isLoading?: boolean;
}

export function WorkspaceSelector({
  workspacesByOrg,
  selectedWorkspaceId,
  onSelect,
  isLoading,
}: WorkspaceSelectorProps) {
  const id = useId();

  // 선택된 워크스페이스 정보 찾기
  const selectedWorkspace = useMemo(() => {
    if (!workspacesByOrg || !selectedWorkspaceId) return null;

    return workspacesByOrg.organizations
      .flatMap(org => org.workspaces)
      .find(ws => ws.id === selectedWorkspaceId) || null;
  }, [workspacesByOrg, selectedWorkspaceId]);

  // 워크스페이스 이름의 첫 글자 가져오기
  const getWorkspaceInitial = (name: string) =>
    name.trim().slice(0, 1).toUpperCase();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Target Workspace</Label>
      <Select
        value={selectedWorkspaceId || undefined}
        onValueChange={onSelect}
        disabled={isLoading}
      >
        <SelectTrigger id={id} className="h-12">
          <SelectValue placeholder="Select workspace..." />
        </SelectTrigger>
        <SelectContent>
          {workspacesByOrg?.organizations.map((org, orgIndex) => (
            <div key={org.id}>
              {orgIndex > 0 && <div className="h-px bg-border my-1" />}
              <SelectGroup>
                <SelectLabel>{org.name}</SelectLabel>
                {org.workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                        {workspace.icon || getWorkspaceInitial(workspace.name)}
                      </div>
                      <span>{workspace.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
