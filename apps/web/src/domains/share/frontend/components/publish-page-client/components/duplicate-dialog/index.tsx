'use client';

import React from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

import { Box } from '@/components/ui/box';

import { WorkspaceSelector } from './components/workspace-selector';
import { useDuplicateDialog } from './core/use-duplicate-dialog';

interface DuplicateDialogProps {
  publishToken: string;
  autoLoadWorkspaces?: boolean;
}

export function DuplicateDialog(props: DuplicateDialogProps) {
  const { publishToken } = props;

  const {
    workspacesByOrg,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    isLoading,
    handleDuplicate,
    isDialogOpen,
    onDialogOpenChange,
    user,
    isCheckingUser,
    handleLogin,
  } = useDuplicateDialog({
    publishToken,
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Copy size={16} />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Duplicate Page</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Show loading state while checking user */}
      {isCheckingUser && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      )}
      {/* Show login prompt if user is not logged in */}
      {!isCheckingUser && !user && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to log in to duplicate this page on your own workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleLogin}>
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
      {/* Show duplicate dialog if user is logged in */}
      {!isCheckingUser && user && (
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Duplicate Page</DialogTitle>
            <DialogDescription>
              The duplicated page will be created in the selected workspace.
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-3">
            <WorkspaceSelector
              workspacesByOrg={workspacesByOrg}
              selectedWorkspaceId={selectedWorkspaceId}
              onSelect={setSelectedWorkspaceId}
              isLoading={isLoading}
            />
          </Box>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDuplicate}
              disabled={!selectedWorkspaceId || isLoading}
            >
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
