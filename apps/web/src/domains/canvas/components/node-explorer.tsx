"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Search,
  Plus,
  Users,
  CheckSquare,
  GitBranch,
  FileText,
  Database,
  Layers,
} from "lucide-react";

// Node type definitions
const NODE_TYPES = [
  {
    type: "agent",
    name: "Agent",
    description: "AI agents with personas, roles, and capabilities",
    icon: Users,
    color: "blue",
    templates: [
      {
        name: "Developer Agent",
        description: "Full-stack development specialist",
      },
      { name: "Designer Agent", description: "UI/UX design expert" },
      {
        name: "QA Agent",
        description: "Quality assurance and testing specialist",
      },
      { name: "PM Agent", description: "Project management and coordination" },
    ],
  },
  {
    type: "task",
    name: "Task",
    description: "Specific tasks with instructions and variables",
    icon: CheckSquare,
    color: "green",
    templates: [
      {
        name: "Code Review Task",
        description: "Review and validate code changes",
      },
      { name: "Design Task", description: "Create UI/UX designs and mockups" },
      {
        name: "Testing Task",
        description: "Execute test cases and report results",
      },
      {
        name: "Documentation Task",
        description: "Write technical documentation",
      },
    ],
  },
  {
    type: "workflow",
    name: "Workflow",
    description: "Sequential processes and procedures",
    icon: GitBranch,
    color: "orange",
    templates: [
      {
        name: "Development Workflow",
        description: "End-to-end development process",
      },
      {
        name: "Design Workflow",
        description: "Design iteration and approval process",
      },
      {
        name: "Testing Workflow",
        description: "Testing and quality assurance process",
      },
      {
        name: "Deployment Workflow",
        description: "Build and deployment process",
      },
    ],
  },
  {
    type: "artifact_template",
    name: "Artifact Template",
    description: "Templates for creating artifacts and deliverables",
    icon: FileText,
    color: "purple",
    templates: [
      {
        name: "PRD Template",
        description: "Product requirements document template",
      },
      { name: "API Spec Template", description: "API specification template" },
      {
        name: "User Story Template",
        description: "User story and acceptance criteria",
      },
      {
        name: "Test Plan Template",
        description: "Test planning and execution template",
      },
    ],
  },
  {
    type: "checklist",
    name: "Checklist",
    description: "Checklists for validation and verification",
    icon: CheckSquare,
    color: "red",
    templates: [
      {
        name: "Code Review Checklist",
        description: "Code review validation checklist",
      },
      {
        name: "Design Review Checklist",
        description: "Design review validation checklist",
      },
      {
        name: "Testing Checklist",
        description: "Testing completion checklist",
      },
      {
        name: "Deployment Checklist",
        description: "Pre-deployment validation checklist",
      },
    ],
  },
  {
    type: "data",
    name: "Data",
    description: "Data models, schemas, and information structures",
    icon: Database,
    color: "cyan",
    templates: [
      {
        name: "User Data Model",
        description: "User profile and authentication data",
      },
      {
        name: "Product Data Model",
        description: "Product catalog and inventory data",
      },
      {
        name: "Analytics Data Model",
        description: "Analytics and metrics data",
      },
      {
        name: "Configuration Data",
        description: "System configuration and settings",
      },
    ],
  },
  {
    type: "artifact_class",
    name: "Artifact Class",
    description: "Classifications and categories for artifacts",
    icon: Layers,
    color: "lime",
    templates: [
      { name: "Documentation Class", description: "Documentation and guides" },
      { name: "Code Class", description: "Source code and scripts" },
      { name: "Design Class", description: "Design files and assets" },
      { name: "Test Class", description: "Test cases and test data" },
    ],
  },
];

interface NodeExplorerProps {
  onNodeCreate?: (nodeType: string, template?: string) => void;
  className?: string;
}

/**
 * Seven Core Node Explorer Component
 */
export function NodeExplorer({ onNodeCreate, className }: NodeExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);

  // Filter node types based on search query
  const filteredNodeTypes = useMemo(() => {
    if (!searchQuery) return NODE_TYPES;

    return NODE_TYPES.filter(
      (nodeType) =>
        nodeType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nodeType.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        nodeType.templates.some(
          (template) =>
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery]);

  // Get color classes
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-green-50 border-green-200 text-green-900",
      orange: "bg-orange-50 border-orange-200 text-orange-900",
      purple: "bg-purple-50 border-purple-200 text-purple-900",
      red: "bg-red-50 border-red-200 text-red-900",
      cyan: "bg-cyan-50 border-cyan-200 text-cyan-900",
      lime: "bg-lime-50 border-lime-200 text-lime-900",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: "text-blue-600",
      green: "text-green-600",
      orange: "text-orange-600",
      purple: "text-purple-600",
      red: "text-red-600",
      cyan: "text-cyan-600",
      lime: "text-lime-600",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const handleNodeCreate = (nodeType: string, template?: string) => {
    onNodeCreate?.(nodeType, template);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Node Explorer</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Browse and create the seven core node types for your workflow canvas
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search node types and templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs
          value={selectedNodeType || "all"}
          onValueChange={setSelectedNodeType}
          className="h-full"
        >
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {NODE_TYPES.map((nodeType) => (
              <TabsTrigger key={nodeType.type} value={nodeType.type}>
                {nodeType.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredNodeTypes.map((nodeType) => (
                <NodeTypeCard
                  key={nodeType.type}
                  nodeType={nodeType}
                  onNodeCreate={handleNodeCreate}
                  getColorClasses={getColorClasses}
                  getIconColor={getIconColor}
                />
              ))}
            </div>
          </TabsContent>

          {NODE_TYPES.map((nodeType) => (
            <TabsContent
              key={nodeType.type}
              value={nodeType.type}
              className="mt-4"
            >
              <div className="p-4">
                <NodeTemplateList
                  nodeType={nodeType}
                  onNodeCreate={handleNodeCreate}
                  getColorClasses={getColorClasses}
                  getIconColor={getIconColor}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// Node Type Card Component
interface NodeTypeCardProps {
  nodeType: (typeof NODE_TYPES)[0];
  onNodeCreate: (nodeType: string, template?: string) => void;
  getColorClasses: (color: string) => string;
  getIconColor: (color: string) => string;
}

function NodeTypeCard({
  nodeType,
  onNodeCreate,
  getColorClasses,
  getIconColor,
}: NodeTypeCardProps) {
  const Icon = nodeType.icon;

  return (
    <Card
      className={`border-2 ${getColorClasses(nodeType.color)} hover:shadow-md transition-shadow`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${getIconColor(nodeType.color)} bg-white/50`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{nodeType.name}</CardTitle>
            <CardDescription className="text-sm">
              {nodeType.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {nodeType.templates.length} templates
          </Badge>
          <Button
            size="sm"
            onClick={() => onNodeCreate(nodeType.type)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Node Template List Component
interface NodeTemplateListProps {
  nodeType: (typeof NODE_TYPES)[0];
  onNodeCreate: (nodeType: string, template?: string) => void;
  getColorClasses: (color: string) => string;
  getIconColor: (color: string) => string;
}

function NodeTemplateList({
  nodeType,
  onNodeCreate,
  getColorClasses,
  getIconColor,
}: NodeTemplateListProps) {
  const Icon = nodeType.icon;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-3 rounded-lg ${getIconColor(nodeType.color)} bg-white/50`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{nodeType.name}</h3>
            <p className="text-muted-foreground">{nodeType.description}</p>
          </div>
        </div>

        <Button
          onClick={() => onNodeCreate(nodeType.type)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Custom {nodeType.name}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodeType.templates.map((template, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNodeCreate(nodeType.type, template.name)}
                className="w-full"
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
