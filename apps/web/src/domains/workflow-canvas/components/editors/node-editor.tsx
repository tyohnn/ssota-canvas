"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@workspace/ui/components/ui/input";
import { Label } from "@workspace/ui/components/ui/label";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card";

interface NodeEditorProps {
  node: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  onUpdate?: (nodeId: string, updates: any) => void;
}

export function NodeEditor({
  node,
  isEditing,
  setIsEditing,
  setHasChanges,
  onUpdate,
}: NodeEditorProps) {
  const [formData, setFormData] = useState({
    name: node?.data?.label || "",
    slug: node?.data?.slug || "",
    description: node?.data?.description || "",
    metadata: node?.data?.metadata || {},
  });

  // Update form data when node changes
  useEffect(() => {
    setFormData({
      name: node?.data?.label || "",
      slug: node?.data?.slug || "",
      description: node?.data?.description || "",
      metadata: node?.data?.metadata || {},
    });
  }, [node]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const updates = {
        name: formData.name,
        slug: formData.slug,
        metadata: {
          ...formData.metadata,
          description: formData.description,
        },
      };

      onUpdate?.(node.id, updates);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving node:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: node?.data?.label || "",
      slug: node?.data?.slug || "",
      description: node?.data?.description || "",
      metadata: node?.data?.metadata || {},
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const getNodeTypeColor = (nodeType: string) => {
    const colorMap = {
      agent: "bg-blue-100 text-blue-800",
      task: "bg-green-100 text-green-800",
      workflow: "bg-orange-100 text-orange-800",
      artifact_template: "bg-purple-100 text-purple-800",
      checklist: "bg-red-100 text-red-800",
      data: "bg-cyan-100 text-cyan-800",
      artifact_class: "bg-lime-100 text-lime-800",
    };
    return (
      colorMap[nodeType as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Node Properties</h3>
          <p className="text-sm text-gray-600">
            Edit node properties and metadata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getNodeTypeColor(node?.type)}>
            {node?.type?.replace("_", " ").toUpperCase()}
          </Badge>
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Basic Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter node name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter node slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter node description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Node Type Specific Properties */}
      {node?.type === "agent" && (
        <AgentProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {node?.type === "task" && (
        <TaskProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {node?.type === "artifact_template" && (
        <TemplateProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {/* Position Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>X Position</Label>
              <Input
                value={node?.position?.x || 0}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Y Position</Label>
              <Input
                value={node?.position?.y || 0}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Agent Properties Component
interface AgentPropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function AgentProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: AgentPropertiesProps) {
  const [agentData, setAgentData] = useState({
    persona: metadata?.persona || "",
    role: metadata?.role || "",
    capabilities: metadata?.capabilities || [],
    tools: metadata?.tools || [],
  });

  useEffect(() => {
    setAgentData({
      persona: metadata?.persona || "",
      role: metadata?.role || "",
      capabilities: metadata?.capabilities || [],
      tools: metadata?.tools || [],
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...agentData, [field]: value };
    setAgentData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="persona">Persona</Label>
          <Textarea
            id="persona"
            value={agentData.persona}
            onChange={(e) => handleChange("persona", e.target.value)}
            disabled={!isEditing}
            placeholder="Describe the agent's persona..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Textarea
            id="role"
            value={agentData.role}
            onChange={(e) => handleChange("role", e.target.value)}
            disabled={!isEditing}
            placeholder="Describe the agent's role..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Capabilities</Label>
          <div className="flex flex-wrap gap-2">
            {agentData.capabilities.map((capability: string, index: number) => (
              <Badge key={index} variant="secondary">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tools</Label>
          <div className="flex flex-wrap gap-2">
            {agentData.tools.map((tool: string, index: number) => (
              <Badge key={index} variant="outline">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Task Properties Component
interface TaskPropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function TaskProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: TaskPropertiesProps) {
  const [taskData, setTaskData] = useState({
    instructions: metadata?.instructions || "",
    variables: metadata?.variables || {},
  });

  useEffect(() => {
    setTaskData({
      instructions: metadata?.instructions || "",
      variables: metadata?.variables || {},
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...taskData, [field]: value };
    setTaskData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Task Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={taskData.instructions}
            onChange={(e) => handleChange("instructions", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter task instructions..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Template Properties Component
interface TemplatePropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function TemplateProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: TemplatePropertiesProps) {
  const [templateData, setTemplateData] = useState({
    artifact_format: metadata?.artifact_format || "",
    definitions: metadata?.definitions || [],
  });

  useEffect(() => {
    setTemplateData({
      artifact_format: metadata?.artifact_format || "",
      definitions: metadata?.definitions || [],
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...templateData, [field]: value };
    setTemplateData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Template Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="artifact_format">Artifact Format</Label>
          <Input
            id="artifact_format"
            value={templateData.artifact_format}
            onChange={(e) => handleChange("artifact_format", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter artifact format..."
          />
        </div>

        <div className="space-y-2">
          <Label>Definitions ({templateData.definitions.length})</Label>
          <div className="space-y-2">
            {templateData.definitions.map((def: any, index: number) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{def.name}</span>
                <span className="text-sm text-gray-600 ml-2">({def.type})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
