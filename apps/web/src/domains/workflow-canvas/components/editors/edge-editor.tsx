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

interface EdgeEditorProps {
  edge: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  onUpdate?: (edgeId: string, updates: any) => void;
}

export function EdgeEditor({
  edge,
  isEditing,
  setIsEditing,
  setHasChanges,
  onUpdate,
}: EdgeEditorProps) {
  const [formData, setFormData] = useState({
    edgeType: edge?.type || "next",
    label: edge?.data?.label || "",
    metadata: edge?.data?.metadata || {},
  });

  // Update form data when edge changes
  useEffect(() => {
    setFormData({
      edgeType: edge?.type || "next",
      label: edge?.data?.label || "",
      metadata: edge?.data?.metadata || {},
    });
  }, [edge]);

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
        edgeType: formData.edgeType,
        data: {
          label: formData.label,
          metadata: formData.metadata,
        },
      };

      onUpdate?.(edge.id, updates);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving edge:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      edgeType: edge?.type || "next",
      label: edge?.data?.label || "",
      metadata: edge?.data?.metadata || {},
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const getEdgeTypeColor = (edgeType: string) => {
    const colorMap = {
      contains: "bg-blue-100 text-blue-800",
      next: "bg-green-100 text-green-800",
      input: "bg-orange-100 text-orange-800",
      output: "bg-purple-100 text-purple-800",
    };
    return (
      colorMap[edgeType as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getEdgeTypeDescription = (edgeType: string) => {
    const descriptions = {
      contains: "Parent-child relationship",
      next: "Sequential flow relationship",
      input: "Data input relationship",
      output: "Data output relationship",
    };
    return (
      descriptions[edgeType as keyof typeof descriptions] ||
      "Unknown relationship type"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Edge Properties</h3>
          <p className="text-sm text-gray-600">
            Edit edge properties and metadata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getEdgeTypeColor(formData.edgeType)}>
            {formData.edgeType.toUpperCase()}
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
          <div className="space-y-2">
            <Label htmlFor="edgeType">Edge Type</Label>
            <Select
              value={formData.edgeType}
              onValueChange={(value) => handleInputChange("edgeType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select edge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="next">Next</SelectItem>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="output">Output</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              {getEdgeTypeDescription(formData.edgeType)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter edge label"
            />
          </div>
        </CardContent>
      </Card>

      {/* Connection Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Node</Label>
              <Input
                value={edge?.source || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Node</Label>
              <Input
                value={edge?.target || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edge Type Specific Properties */}
      {formData.edgeType === "next" && (
        <NextEdgeProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {formData.edgeType === "input" && (
        <InputEdgeProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {formData.edgeType === "output" && (
        <OutputEdgeProperties
          metadata={formData.metadata}
          isEditing={isEditing}
          onMetadataChange={(metadata) => {
            setFormData((prev) => ({ ...prev, metadata }));
            setHasChanges(true);
          }}
        />
      )}

      {/* Style Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Style Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <Input
                value={edge?.style?.stroke || "#6b7280"}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Stroke Width</Label>
              <Input
                value={edge?.style?.strokeWidth || 2}
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

// Next Edge Properties Component
interface NextEdgePropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function NextEdgeProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: NextEdgePropertiesProps) {
  const [nextData, setNextData] = useState({
    condition: metadata?.condition || "",
    priority: metadata?.priority || 1,
  });

  useEffect(() => {
    setNextData({
      condition: metadata?.condition || "",
      priority: metadata?.priority || 1,
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...nextData, [field]: value };
    setNextData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Next Edge Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Textarea
            id="condition"
            value={nextData.condition}
            onChange={(e) => handleChange("condition", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter condition for this flow..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            value={nextData.priority}
            onChange={(e) => handleChange("priority", parseInt(e.target.value))}
            disabled={!isEditing}
            min={1}
            max={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Input Edge Properties Component
interface InputEdgePropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function InputEdgeProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: InputEdgePropertiesProps) {
  const [inputData, setInputData] = useState({
    dataType: metadata?.dataType || "string",
    required: metadata?.required || false,
    defaultValue: metadata?.defaultValue || "",
  });

  useEffect(() => {
    setInputData({
      dataType: metadata?.dataType || "string",
      required: metadata?.required || false,
      defaultValue: metadata?.defaultValue || "",
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...inputData, [field]: value };
    setInputData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Input Edge Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dataType">Data Type</Label>
          <Select
            value={inputData.dataType}
            onValueChange={(value) => handleChange("dataType", value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            value={inputData.defaultValue}
            onChange={(e) => handleChange("defaultValue", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter default value"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={inputData.required}
            onChange={(e) => handleChange("required", e.target.checked)}
            disabled={!isEditing}
          />
          <Label htmlFor="required">Required</Label>
        </div>
      </CardContent>
    </Card>
  );
}

// Output Edge Properties Component
interface OutputEdgePropertiesProps {
  metadata: any;
  isEditing: boolean;
  onMetadataChange: (metadata: any) => void;
}

function OutputEdgeProperties({
  metadata,
  isEditing,
  onMetadataChange,
}: OutputEdgePropertiesProps) {
  const [outputData, setOutputData] = useState({
    dataType: metadata?.dataType || "string",
    format: metadata?.format || "",
    validation: metadata?.validation || "",
  });

  useEffect(() => {
    setOutputData({
      dataType: metadata?.dataType || "string",
      format: metadata?.format || "",
      validation: metadata?.validation || "",
    });
  }, [metadata]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...outputData, [field]: value };
    setOutputData(newData);
    onMetadataChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Output Edge Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="outputDataType">Data Type</Label>
          <Select
            value={outputData.dataType}
            onValueChange={(value) => handleChange("dataType", value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <Input
            id="format"
            value={outputData.format}
            onChange={(e) => handleChange("format", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter output format"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validation">Validation</Label>
          <Textarea
            id="validation"
            value={outputData.validation}
            onChange={(e) => handleChange("validation", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter validation rules..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
