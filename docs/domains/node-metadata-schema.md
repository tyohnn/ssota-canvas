# Node Metadata Schema & Connection Rules

## Executive Summary

This document defines the metadata schema for all 7 core node types in the xbowl Universal Node System, their connection rules, and the design mode interaction patterns. Each node type has specific metadata requirements and connection capabilities that support the dual canvas system.

**Key Components:**

- 7 Core Node Types: Agent, Task, Workflow, Artifact Template, Checklist, Data, Artifact Class
- Editor Panel System for metadata editing
- Hierarchical connection rules with input/output edge types
- Template-driven artifact generation system

## Universal Node System Core Principles

### Node Hierarchy Architecture

- **Parent-Child Relationships**: All nodes exist in hierarchical relationships within the Universal Node System
- **Editor Panel Overlay**: Clicking any node opens a z-index overlay editor panel showing metadata and connected nodes
- **2D Canvas Alternative Rendering**: Editor panels provide an alternative view of the 2D canvas focused on the selected node's context

### Common Metadata Fields

All node types include these base metadata fields:

- `slug` (string, required): Development-friendly identifier
- `name` (string, required): Human-readable display name
- `created_at` (datetime, required): Creation timestamp
- `created_by` (string, required): Creator user ID
- `updated_at` (datetime, required): Last modification timestamp
- `version` (string, required): Version identifier

## Core Node Type Definitions

### 1. Agent Node

**Purpose**: Defines AI agent personas and capabilities within workflows

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly agent identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Persona name for the agent"
  },
  "persona_definition": {
    "type": "markdown",
    "required": true,
    "description": "Detailed persona definition in markdown"
  },
  "role_definition": {
    "type": "markdown",
    "required": true,
    "description": "Specific role and responsibilities definition"
  },
  "parent_node": node_id,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Connected Node Types**: Task, Data, Checklist, Artifact Template
- **Edge Type**: `contains` (inclusion relationship only)
- **Hierarchy**: Agent → [Task, Data, Checklist, Artifact Template]

**Editor Panel Features**:

- Persona definition editor with markdown support
- Role definition editor with markdown support
- Connected nodes visualization in alternative 2D rendering
- Agent team relationship display (when applicable)

### 2. Task Node

**Purpose**: Defines executable tasks with markdown instructions and variable parameters

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly task identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Task display name"
  },
  "description": {
    "type": "markdown",
    "required": true,
    "description": "Detailed task instructions in markdown format"
  },
  "variables": {
    "type": "object",
    "required": false,
    "description": "Variable definitions for task execution",
    "schema": {
      "variable_name": {
        "type": "string",
        "description": "Variable description",
        "required": "boolean",
        "default_value": "any"
      }
    }
  },
  "parent_node": node_id,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Input Edge Type**: `input`
  - **Connected Node Types**: Data, Checklist, Artifact Class (from other tasks), Artifact Template
- **Output Edge Type**: `output`
  - **Connected Node Types**: Artifact Class (design mode), Artifact Instance (execution mode)
- **Hierarchy**: [Input Nodes] - input edge → Task - out edge → [Output Nodes]

**Critical Design Decision - Artifact Class vs Template**:

- **Problem**: Design mode cannot show actual artifacts (not yet created)
- **Solution**: Use Artifact Class nodes as abstract concept nodes
- **Example**: Task generates IA → connects to IA Template (input) + Project Brief Class (output)
- **Distinction**: Artifact Class (design abstraction) vs Artifact Instance (execution reality)

### 3. Workflow Node

**Purpose**: Orchestrates multiple tasks, agents, and artifacts in executable sequences

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly workflow identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Workflow display name"
  },
  "description": {
    "type": "markdown",
    "required": true,
    "description": "Detailed workflow description in markdown"
  },
  "parent_node": node_id,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Connected Node Types**: Artifact Class, Task, Agent, Start, Conditional, Workflow (nested)
- **Edge Type**: `next` (flow progression)
- **Edge Metadata**:
  ```json
  {
    "condition": "string",
    "description": "string",
    "priority": "number"
  }
  ```
- **Hierarchy**: Workflow → [Task, Agent, Artifact, Flow Control Nodes]
- **Self-Reference**: Workflows can contain other workflows as nested components

**Special Flow Control Nodes**:

- **Start Node**: Workflow entry point
- **Conditional Node**: Decision points with branching logic
- **End Node**: Workflow completion point

### 4. Template Node

**Purpose**: Defines artifact structure and format for consistent output generation

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly template identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Template display name"
  },
  "artifact_format": {
    "type": "string",
    "required": true,
    "enum": ["flow", "markdown", "table", "custom"],
    "description": "Output format type"
  },
  "layout": {
    "type": "object",
    "required": false,
    "applicable_when": "artifact_format === 'flow'",
    "schema": {
      "type": "string",
      "direction": "string",
      "spacing": "number",
      "node_spacing": "number",
      "rank_spacing": "number",
      "padding": "number"
    }
  },
  "parent_node": node_id,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Flow Format**: Contains [Node Definition] + [Edge Definition] nodes
- **Table Format**: Contains [Column Definition] nodes
- **Auto-Generation**: Creating template automatically creates corresponding Artifact Class node

**Sub-Node Types for Templates**:

#### [Node Definition] Node

```json
{
  "slug": "string",
  "name": "string",
  "description": "string",
  "ai_instruction": "string (how AI should populate this node)",
  "design_properties": {
    "color": "string",
    "icon": "string",
    "shape": "string",
    "style": "object",
    ...etc
  },
  "metadata_schema": {
    "field_name": {
      "type": "string",
      "input_type": "text|textarea|select|checkbox|etc",
      "description": "string",
      "required": "boolean",
      "validation": "object"
    }
  }
}
```

#### [Edge Definition] Node

```json
{
  "slug": "string",
  "name": "string",
  "description": "string",
  "style_properties": {
    "color": "string",
    "line_style": "solid|dashed|dotted",
    "arrow_type": "string"
  },
  "metadata_schema": {
    "field_name": {
      "type": "string",
      "description": "string",
      "required": "boolean"
    }
  }
}
```

#### [Column Definition] Node (for table format)

```json
{
  "slug": "string",
  "name": "string",
  "data_type": "string|number|date|boolean",
  "description": "string",
  "required": "boolean",
  "validation": "object"
}
```

### 5. Checklist Node

**Purpose**: Provides structured validation and process guidance

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly checklist identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Checklist display name"
  },
  "description": {
    "type": "markdown",
    "required": true,
    "description": "Detailed checklist content in markdown"
  },
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Current State**: No connected nodes (standalone)
- **Future Enhancement**: Will support sub-checklist items and validation rules

### 6. Data Node

**Purpose**: Stores reference data and information for workflow consumption

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly data identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Data node display name"
  },
  "content": {
    "type": "markdown",
    "required": true,
    "description": "Data content in markdown format"
  },
  "parent_node": node_id,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Current State**: No connected nodes (standalone)
- **Future Enhancement**: Will support data relationships and references

### 7. Artifact Class Node (Design Mode Abstraction)

**Purpose**: Abstract representation of artifacts for design mode connections

**Metadata Schema**:

```json
{
  "slug": {
    "type": "string",
    "required": true,
    "description": "Development-friendly artifact class identifier"
  },
  "name": {
    "type": "string",
    "required": true,
    "description": "Artifact class display name"
  },
  "description": {
    "type": "markdown",
    "required": false,
    "description": "Artifact class description"
  },
  "parent_node": template_reference,
  "created_at": { "type": "datetime", "required": true },
  "created_by": { "type": "string", "required": true },
  "updated_at": { "type": "datetime", "required": true },
  "version": { "type": "string", "required": true }
}
```

**Connection Rules**:

- **Auto-Generated**: Created automatically when Template node is created
- **Input Connections**: Can receive from Task output edges
- **Output Connections**: Can provide input to other Tasks
- **Execution Distinction**: Artifact Class (design) vs Artifact Instance (runtime)

## Design Mode Interaction Patterns

### Left Panel - Node Selection

1. **Node Browser**: Display available node types with hierarchical organization
2. **Node Selection**: User clicks node type to load in center canvas
3. **Context Loading**: Selected node and its connected child nodes appear on canvas

### Center Canvas - Visual Design

1. **Node Display**: Show selected node and its hierarchical children
2. **Connection Visualization**: Display edges between connected nodes
3. **Drag-and-Drop**: Enable node positioning and connection creation
4. **Node Creation**: Add new child nodes by dragging from left panel

### Right Panel - Metadata Editor (Z-Index Overlay)

1. **Node Selection Trigger**: Clicking any canvas node opens overlay editor panel
2. **Context-Aware Rendering**: Panel adapts based on selected node type
3. **Metadata Forms**: Dynamic forms based on node type schema
4. **Connected Nodes View**: Alternative 2D rendering showing node relationships
5. **Real-time Updates**: Changes immediately reflected in canvas and data model

### Template Builder Special Features

1. **Node / Edge Definition Editor**: Visual designer for flow node types and edge types
2. **Design Properties**: Color, icon, shape customization interface
3. **Metadata Schema Builder**: Form builder for defining node metadata fields
4. **Preview System**: Real-time preview of how templates will render

### Workflow Designer Special Features

1. **Flow Control**: Start, conditional, and end node creation
2. **Sequence Definition**: Next edge creation with conditional metadata
3. **Nested Workflows**: Ability to include other workflows as components
4. **Execution Preview**: Visualization of how workflow will execute

## Validation Rules

### Node-Level Validation

- **Required Fields**: All required metadata fields must be populated
- **Slug Uniqueness**: Slugs must be unique within their node type scope
- **Format Validation**: Markdown fields validated for syntax
- **Reference Integrity**: Template references must point to valid templates

### Connection-Level Validation

- **Valid Connections**: Only allowed node types can be connected
- **Edge Type Consistency**: Edge types must match connection rules
- **Circular Dependency Prevention**: No circular references in workflow flows
- **Input/Output Balance**: Tasks must have valid input and output connections

### Workflow-Level Validation

- **Complete Flows**: Workflows must have start and end points
- **Reachable Nodes**: All nodes must be reachable from start
- **Conditional Logic**: Conditional nodes must have valid branching logic

## Implementation Notes

### Database Schema Considerations

- **Polymorphic Node Table**: Single table with node_type discriminator
- **Metadata JSON Fields**: Store type-specific metadata as JSON
- **Edge Table**: Separate table for node connections with edge metadata
- **Version History**: Track all node changes for audit and rollback

### UI Component Architecture

- **Dynamic Form Rendering**: Build forms from metadata schemas
- **Node Type Renderers**: Specialized components for each node type
- **Editor Panel System**: Overlay management with context switching
- **Canvas Integration**: React Flow integration with custom node types

### API Design Patterns

- **Type-Safe Operations**: Validate node operations against schemas
- **Batch Updates**: Support multiple node updates in single transaction
- **Relationship Management**: Efficient queries for node hierarchies
- **Template Instantiation**: Convert templates to artifact instances

This schema provides the foundation for implementing the xbowl Universal Node System with full support for the 7 core node types and their interaction patterns in design mode.
