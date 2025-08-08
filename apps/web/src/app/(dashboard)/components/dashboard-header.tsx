import React from "react";
import { ChevronsUpDown, Settings, Moon, Sun } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { SelectTrigger } from "@workspace/ui/components/select";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { NavigationLinks } from "./navigation-links";
import { ThemeToggle } from "./theme-toggle";

// Temporary data
const organizations = [
  { id: "org1", name: "Acme Corp" },
  { id: "org2", name: "TechStart Inc" },
  { id: "org3", name: "Digital Agency" },
];

const projects = [
  { id: "proj1", name: "Main Project", orgId: "org1" },
  { id: "proj2", name: "Mobile App", orgId: "org1" },
  { id: "proj3", name: "Web Platform", orgId: "org2" },
];

const workspaces = [
  { id: "ws1", name: "Development", projectId: "proj1" },
  { id: "ws2", name: "Staging", projectId: "proj1" },
  { id: "ws3", name: "Production", projectId: "proj2" },
];

interface DashboardHeaderProps {
  className?: string;
  isLoading?: boolean;
  workspaceId?: string; // 향후 동적 라우팅을 위한 workspaceId
}

export function DashboardHeader({
  className,
  isLoading = false,
  workspaceId,
}: DashboardHeaderProps) {
  return (
    <header
      className={`border-b-2 border-border bg-background px-4 md:px-6 ${className}`}
    >
      <div className="flex h-12 items-center justify-between gap-3">
        {/* Left side - Logo and Selectors */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              X
            </div>
            <span className="font-semibold text-foreground text-sm">Xbowl</span>
          </div>

          {/* 3-tier Selectors */}
          {isLoading ? (
            <div className="flex items-center gap-1">
              <Skeleton className="h-6 w-20" />
              <span className="text-muted-foreground/40 text-xs mx-1">/</span>
              <Skeleton className="h-6 w-24" />
              <span className="text-muted-foreground/40 text-xs mx-1">/</span>
              <Skeleton className="h-6 w-20" />
            </div>
          ) : (
            <Breadcrumb>
              <BreadcrumbList className="text-xs text-muted-foreground sm:gap-0">
                {/* Organization Selector */}
                <BreadcrumbItem>
                  <Select defaultValue="org1">
                    <SelectTrigger
                      aria-label="Select organization"
                      className="focus-visible:bg-accent text-foreground h-6 px-1.5 focus-visible:ring-0 text-xs border-0 bg-transparent hover:bg-accent shadow-none"
                    >
                      <SelectValue />
                      <ChevronsUpDown
                        size={10}
                        className="text-muted-foreground/60 ml-0.5"
                      />
                    </SelectTrigger>
                    <SelectContent className="border-border/50 border-2">
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="text-muted-foreground/40 text-xs mx-1">
                  /
                </BreadcrumbSeparator>

                {/* Project Selector */}
                <BreadcrumbItem>
                  <Select defaultValue="proj1">
                    <SelectTrigger
                      aria-label="Select project"
                      className="focus-visible:bg-accent text-foreground h-6 px-1.5 focus-visible:ring-0 text-xs border-0 bg-transparent hover:bg-accent shadow-none"
                    >
                      <SelectValue />
                      <ChevronsUpDown
                        size={10}
                        className="text-muted-foreground/60 ml-0.5"
                      />
                    </SelectTrigger>
                    <SelectContent className="border-border/50 border-2">
                      {projects
                        .filter((p) => p.orgId === "org1")
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="text-muted-foreground/40 text-xs mx-1">
                  /
                </BreadcrumbSeparator>

                {/* Workspace Selector */}
                <BreadcrumbItem>
                  <Select defaultValue="ws1">
                    <SelectTrigger
                      aria-label="Select workspace"
                      className="focus-visible:bg-accent text-foreground h-6 px-1.5 focus-visible:ring-0 text-xs border-0 bg-transparent hover:bg-accent shadow-none"
                    >
                      <SelectValue />
                      <ChevronsUpDown
                        size={10}
                        className="text-muted-foreground/60 ml-0.5"
                      />
                    </SelectTrigger>
                    <SelectContent className="border-border/50 border-2">
                      {workspaces
                        .filter((w) => w.projectId === "proj1")
                        .map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Right side - Navigation Links, Settings, Dark Mode, Profile */}
        <div className="flex items-center gap-4">
          {/* Navigation Links */}
          <NavigationLinks workspaceId={workspaceId} />

          {/* Settings, Dark Mode, Profile */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Profile Avatar - Clerk UserButton */}
            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "h-8 w-8 rounded-full border-2 border-border bg-background",
                    userButtonPopoverCard:
                      "text-xs bg-background border border-border",
                    userButtonPopoverActionButton: "text-xs hover:bg-accent",
                    userButtonTrigger:
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:opacity-80 transition-opacity bg-background",
                  },
                  variables: {
                    colorPrimary: "hsl(var(--primary))",
                    colorBackground: "hsl(var(--background))",
                    colorText: "hsl(var(--foreground))",
                  },
                }}
                afterSignOutUrl="/sign-in"
                showName={false}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
