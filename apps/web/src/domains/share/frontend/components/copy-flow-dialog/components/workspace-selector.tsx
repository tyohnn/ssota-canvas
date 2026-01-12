'use client';

import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/ui/command';
import { Button } from '@workspace/ui/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceSelectionViewDTO } from '../../../../shared/dtos';

interface WorkspaceSelectorProps {
  workspaces: WorkspaceSelectionViewDTO['workspaces'];
  selectedWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
  isLoading?: boolean;
}

export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  onSelect,
  isLoading,
}: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedWorkspace = workspaces.find(
    (workspace) => workspace.id === selectedWorkspaceId
  );

  const getWorkspaceInitial = (name: string) =>
    name.trim().slice(0, 1).toUpperCase();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground ml-1">
        Target Workspace
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 px-3"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                {selectedWorkspace?.icon || getWorkspaceInitial(selectedWorkspace?.name || 'W')}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate font-medium">
                  {selectedWorkspace ? selectedWorkspace.name : "Select workspace..."}
                </span>
                {selectedWorkspace?.organizationName && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {selectedWorkspace.organizationName}
                  </span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search workspace..." />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup>
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={workspace.name}
                    onSelect={() => {
                      onSelect(workspace.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                      {workspace.icon || getWorkspaceInitial(workspace.name)}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate font-medium">
                        {workspace.name}
                      </span>
                      {workspace.organizationName && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {workspace.organizationName}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedWorkspaceId === workspace.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
