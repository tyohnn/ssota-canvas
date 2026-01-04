'use client';

import React, { useEffect, useState } from 'react';
import { useShare } from '../hooks/use-share';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { Button } from '@workspace/ui/components/ui/button';

interface CopyFlowDialogProps {
  publishToken: string;
  isOpen: boolean;
  onClose: () => void;
  onLoginRequired: () => void;
  autoLoadWorkspaces?: boolean;
}

export function CopyFlowDialog({
  publishToken,
  isOpen,
  onClose,
  onLoginRequired,
  autoLoadWorkspaces = true,
}: CopyFlowDialogProps) {
  const { workspaces, loadWorkspaces, copyPublishedPage } = useShare();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const getWorkspaceInitial = (name: string) =>
    name.trim().slice(0, 1).toUpperCase();
  const hasWorkspaces = workspaces.length > 0;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedWorkspace = workspaces.find(
    workspace => workspace.id === selectedWorkspaceId
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedWorkspaceId && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0]?.id ?? null);
    }
  }, [isOpen, selectedWorkspaceId, workspaces]);

  useEffect(() => {
    if (!isOpen) return;
    if (!autoLoadWorkspaces) return;
    setIsLoading(true);
    setError(null);
    setResult('idle');
    loadWorkspaces()
      .catch(err => {
        const message = (err as Error).message ?? 'Failed to load workspaces';
        if (message.includes('Login required')) {
          onLoginRequired();
          onClose();
          return;
        }
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, autoLoadWorkspaces, loadWorkspaces, onLoginRequired, onClose]);

  const handleCopy = async () => {
    if (!selectedWorkspaceId) return;

    try {
      const response = await copyPublishedPage({
        publishToken,
        targetWorkspaceId: selectedWorkspaceId,
      });

      if (response.status === 'failed') {
        setResult('failed');
        setError(response.errorMessage ?? 'Failed to copy page');
        return;
      }

      setResult('success');
    } catch (err) {
      const error = err as Error;
      if (error instanceof ShareManagementError && error.code === 'LOGIN_REQUIRED') {
        onLoginRequired();
        return;
      }

      if (error.message.includes('Login required')) {
        onLoginRequired();
        return;
      }

      setResult('failed');
      setError(error.message ?? 'Failed to copy page');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">페이지 복제</h3>
          <p className="text-sm text-muted-foreground">
            복제된 페이지는 선택한 워크스페이스에 생성됩니다.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && !hasWorkspaces && (
            <div className="space-y-2">
              <div className="h-12 w-full rounded-lg border border-border/60 bg-muted/40 animate-pulse" />
              <div className="h-12 w-full rounded-lg border border-border/60 bg-muted/40 animate-pulse" />
            </div>
          )}
          {!isLoading && !hasWorkspaces && (
            <p className="text-sm text-muted-foreground">
              선택 가능한 워크스페이스가 없습니다.
            </p>
          )}
          {hasWorkspaces && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
                    {selectedWorkspace
                      ? selectedWorkspace.icon ||
                        getWorkspaceInitial(selectedWorkspace.name)
                      : getWorkspaceInitial(workspaces[0]?.name || 'W')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedWorkspace
                        ? selectedWorkspace.name
                        : '워크스페이스 선택'}
                    </p>
                    {selectedWorkspace?.organizationName && (
                      <p className="text-xs text-muted-foreground">
                        {selectedWorkspace.organizationName}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground">
                  {isDropdownOpen ? '▴' : '▾'}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="max-h-64 overflow-auto rounded-lg border border-border bg-background shadow-sm">
                  {workspaces.map(workspace => {
                    const isSelected = selectedWorkspaceId === workspace.id;
                    const iconLabel =
                      workspace.icon || getWorkspaceInitial(workspace.name);
                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => {
                          setSelectedWorkspaceId(workspace.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                          {iconLabel}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {workspace.name}
                          </p>
                          {workspace.organizationName && (
                            <p className="text-xs text-muted-foreground">
                              {workspace.organizationName}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs font-semibold text-primary">
                            선택됨
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {result === 'success' && (
          <p className="mt-3 text-sm text-emerald-600">
            복제가 완료되었습니다.
          </p>
        )}
        {result === 'failed' && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={!selectedWorkspaceId || isLoading}
          >
            복제
          </Button>
        </div>
      </div>
    </div>
  );
}
