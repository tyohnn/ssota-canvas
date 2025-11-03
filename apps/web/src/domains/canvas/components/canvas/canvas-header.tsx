'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import { useCanvasPageCommandsContext } from '@/domains/canvas/contexts/CanvasPageCommandsContext';
import { useOrganizationContext } from '@/domains/dashboard/context/OrganizationCotext';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@workspace/ui/components/ui/breadcrumb';
import { Separator } from '@workspace/ui/components/ui/separator';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { ViewSwitcher } from './view-switcher';
import { SidebarTrigger } from '@workspace/ui/components/ui/sidebar';

interface CanvasHeaderProps {
  workspaceId: string;
}

export function CanvasHeader({ workspaceId }: CanvasHeaderProps) {
  const data = useCanvasData();
  const commands = useCanvasPageCommandsContext();
  const { activeOrganization, orgWorkspaces, setActiveWorkspace } =
    useOrganizationContext();

  // Get workspace and selected page data
  const activeWorkspace = orgWorkspaces.find(ws => ws.id === workspaceId);

  React.useEffect(() => {
    setActiveWorkspace(activeWorkspace ?? null);
  }, []);

  // Get canvas mode and selected blocks from context
  const {
    canvasMode,
    selectedPageId,
    selectedPageBlock,
    selectedComponentBlock,
  } = data;

  // Title editing state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync title state
  useEffect(() => {
    if (selectedPageBlock) {
      setTitle(selectedPageBlock.title);
    }
  }, [selectedPageBlock]);

  // Title editing handlers
  const handleTitleClick = () => {
    if (selectedPageBlock) {
      setIsEditing(true);
      setTitle(selectedPageBlock.title);
    }
  };

  const handleTitleSave = async () => {
    if (
      selectedPageId &&
      selectedPageBlock &&
      title.trim() !== selectedPageBlock?.title
    ) {
      const newTitle = title.trim();
      const result = await commands.updatePage(selectedPageId, {
        title: newTitle,
      });

      if (!result.ok) {
        console.error('Failed to update block:', result.error);
        setTitle(selectedPageBlock.title);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      if (!selectedPageBlock) return;
      setTitle(selectedPageBlock.title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleTitleSave();
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const workspaceTitle = activeWorkspace?.name || 'Workspace';
  const workspaceIconName = ((activeWorkspace?.icon_name as string) ||
    'presentation') as IconName;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-background/60 backdrop-blur-md">
      {/* Left side: Logo and breadcrumb */}
      <div className="flex flex-1 items-center gap-2 px-3">
        {/* Sidebar toggle button */}
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${activeOrganization?.slug}/${workspaceId}`}
                className="flex items-center"
              >
                <span className="inline-flex items-center gap-1.5">
                  <DynamicIcon name={workspaceIconName} className="size-4" />
                  <span>{workspaceTitle}</span>
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {selectedPageBlock && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Input
                        ref={inputRef}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="h-6 px-2 text-sm border-none bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                        maxLength={100}
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTitleClick}
                        className="h-6 px-2 text-sm font-medium hover:bg-accent/50 underline decoration-muted-foreground/30 hover:decoration-muted-foreground/60"
                      >
                        <DynamicIcon
                          name={
                            (selectedPageBlock.icon_name || 'file') as IconName
                          }
                          className="h-3 w-3 mr-1 text-muted-foreground"
                        />
                        {selectedPageBlock.title}
                      </Button>
                    )}
                    <ViewSwitcher />
                  </div>
                </BreadcrumbItem>
                {canvasMode === 'component' && selectedComponentBlock && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
                        <DynamicIcon name="blocks" className="h-4 w-4" />
                        {selectedComponentBlock.title}
                      </span>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
