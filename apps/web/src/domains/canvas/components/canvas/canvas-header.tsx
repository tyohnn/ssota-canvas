"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useOrganizationContext } from "@/domains/dashboard/context/OrganizationCotext";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb";
import { Separator } from "@workspace/ui/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ViewSwitcher } from "./view-switcher";

interface CanvasHeaderProps {
  workspaceId: string;
}

export function CanvasHeader({ workspaceId }: CanvasHeaderProps) {
  const router = useRouter();
  const data = useCanvasData();
  const sel = useCanvasSelection();
  const commands = useCanvasCommandsContext();
  const { activeOrganization, orgWorkspaces } = useOrganizationContext();

  // Get workspace and selected page data
  const activeWorkspace = orgWorkspaces.find((ws) => ws.id === workspaceId);
  const selectedPageBlock = sel.pageId ? data.blocksById[sel.pageId] : null;
  const selectedComponentBlock = sel.componentId
    ? data.blocksById[sel.componentId]
    : null;

  // Get canvas mode from selection context
  const { canvasMode } = sel;

  // Title editing state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync title state
  useEffect(() => {
    if (selectedPageBlock) {
      setTitle(selectedPageBlock.name);
    }
  }, [selectedPageBlock?.name]);

  // Navigation handlers
  const handleLogoClick = () => {
    if (activeOrganization?.slug) {
      router.push(`/${activeOrganization.slug}`);
    }
  };

  // Title editing handlers
  const handleTitleClick = () => {
    if (selectedPageBlock) {
      setIsEditing(true);
      setTitle(selectedPageBlock.name);
    }
  };

  const handleTitleSave = async () => {
    if (selectedPageBlock && title.trim() !== selectedPageBlock.name) {
      const newTitle = title.trim();
      const result = await commands.updateBlock(selectedPageBlock.id, {
        name: newTitle,
      });

      if (!result.ok) {
        console.error("Failed to update block:", result.error);
        setTitle(selectedPageBlock.name);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitle(selectedPageBlock?.name || "");
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

  const workspaceTitle = activeWorkspace?.name || "Workspace";
  const workspaceIconName = ((activeWorkspace?.icon_name as string) ||
    "presentation") as IconName;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-background/60 backdrop-blur-md">
      {/* Left side: Logo and breadcrumb */}
      <div className="flex flex-1 items-center gap-2 px-3">
        {/* SSOTA Logo with improved hover navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogoClick}
          className="h-8 px-2 font-semibold hover:bg-accent/50 group relative"
        >
          <span className="group-hover:opacity-0 transition-opacity duration-200">
            SSOTA
          </span>
          <ArrowLeft className="h-4 w-4 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </Button>

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
                        onChange={(e) => setTitle(e.target.value)}
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
                            (selectedPageBlock.icon_name || "file") as IconName
                          }
                          className="h-3 w-3 mr-1 text-muted-foreground"
                        />
                        {selectedPageBlock.name}
                      </Button>
                    )}
                    <ViewSwitcher />
                  </div>
                </BreadcrumbItem>
                {canvasMode === "component" && selectedComponentBlock && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
                        <DynamicIcon name="blocks" className="h-4 w-4" />
                        {selectedComponentBlock.name}
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
