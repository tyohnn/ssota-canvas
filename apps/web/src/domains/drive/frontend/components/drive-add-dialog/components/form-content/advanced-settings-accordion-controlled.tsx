'use client';

import { Box } from '@/components/ui/box';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkspaceIcon } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import { ChevronDown } from 'lucide-react';

export interface AdvancedSettingsAccordionControlledProps {
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
}

export function AdvancedSettingsAccordionControlled({
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
}: AdvancedSettingsAccordionControlledProps) {
  return (
    <Collapsible defaultOpen={false} className="border border-border rounded-md">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180">
        Advanced settings
        <ChevronDown className="size-3.5 shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Box className="flex flex-col gap-4 px-3 pb-3 pt-1">
          <Box className="space-y-2">
            <label
              htmlFor="drive-block-title"
              className="text-xs font-medium text-muted-foreground"
            >
              Title
            </label>
            <Input
              id="drive-block-title"
              placeholder="Block title"
              value={title}
              onChange={e => onTitleChange(e.target.value)}
            />
          </Box>
          <Box className="space-y-2">
            <label
              htmlFor="drive-workspace"
              className="text-xs font-medium text-muted-foreground"
            >
              Workspace
            </label>
            <Select
              value={workspaceId || undefined}
              onValueChange={onWorkspaceIdChange}
              disabled={isLoadingWorkspaces}
            >
              <SelectTrigger id="drive-workspace" className="min-w-0 [&>span]:truncate">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(w => (
                  <SelectItem key={w.workspaceId} value={w.workspaceId}>
                    <Box className="flex gap-2 items-center min-w-0">
                      <WorkspaceIcon
                        icon={w.icon}
                        size={14}
                        className="shrink-0"
                      />
                      <span className="truncate">{w.name}</span>
                    </Box>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        </Box>
      </CollapsibleContent>
    </Collapsible>
  );
}
