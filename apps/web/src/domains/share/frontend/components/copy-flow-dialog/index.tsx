'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';

import { WorkspaceSelector } from './components/workspace-selector';
import { useCopyFlow } from './hooks/use-copy-flow';

interface CopyFlowDialogProps {
  publishToken: string;
  isOpen: boolean;
  onClose: () => void;
  onLoginRequired: () => void;
  autoLoadWorkspaces?: boolean;
}

export function CopyFlowDialog(props: CopyFlowDialogProps) {
  const { isOpen, onClose } = props;
  const {
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    error,
    result,
    isLoading,
    handleCopy
  } = useCopyFlow(props);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Copy Page</DialogTitle>
          <DialogDescription>
            The copied page will be created in the selected workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <WorkspaceSelector
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelect={setSelectedWorkspaceId}
            isLoading={isLoading}
          />
        </div>

        {result === 'success' && (
          <p className="text-sm text-emerald-600">
            Copy completed successfully.
          </p>
        )}
        {result === 'failed' && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={!selectedWorkspaceId || isLoading}
          >
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
