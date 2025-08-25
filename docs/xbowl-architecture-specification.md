# xbowl Architecture Specification: Scratch for AI Agents

## Executive Summary

**Core Innovation**: xbowl introduces a revolutionary approach to AI agent orchestration through **artifact-based, multi-session workflows** that mirror real-world team collaboration, fundamentally different from traditional conversational AI platforms.

**Key Differentiators**:

- **Multi-Session Architecture**: Each agent operates in separate sessions with artifact handoffs (vs. single conversational session)
- **Artifact-Centric Workflow**: Context flows through editable, version-controlled artifacts (vs. conversational context)
- **Visual Workflow Management**: React Flow-based canvas for both workflow design and execution monitoring
- **Human-Centric UX**: "Work with AI agents like real team members" (vs. "talk to one AI that changes roles")

## Core Architecture Principles

### 1. Multi-Session vs. Single-Session Architecture

#### **xbowl Approach: Multi-Session with Artifact Handoffs**

```
Workflow Instance:
├── Agent A Session → Artifact 1
├── Agent B Session → Artifact 2 (using Artifact 1 as input)
├── Agent C Session → Artifact 3 (using Artifact 2 as input)
└── Human Review/Edit → Modified Artifact → Next Agent
```

#### **Traditional Approach: Single Conversational Session**

```
Single Chat Session:
├── Agent A: "I'll research this topic..."
├── Agent B: "Based on that research, I'll write..."
├── Agent C: "Now I'll edit the content..."
└── All context flows through conversation
```

**Advantages of Multi-Session**:

- **Clear Accountability**: Each agent has distinct responsibilities
- **Human Control**: Users can review and edit artifacts between steps
- **Debugging**: Easy to identify which agent produced what output
- **Scalability**: Agents can work independently and in parallel
- **Transparency**: All deliverables are visible and editable

### 2. Artifact-Based Context Management

#### **Artifact Types (Initial Support)**

1. **Markdown Documents** (.md)

   - Project briefs, requirements, documentation
   - Rich text with formatting and structure
   - Version-controlled and editable

2. **React Flow Diagrams** (.flow)
   - Visual representations of workflows
   - Interactive node-edge relationships
   - Customizable node types and connections

#### **Artifact Lifecycle**

```
Creation → Review → Edit → Handoff → Consumption → Archive
```

**Key Features**:

- **Version Control**: Track changes and modifications
- **Editability**: Users can modify artifacts before handoff
- **Validation**: Check artifacts against templates and requirements
- **Metadata**: Rich information about creation, modification, and usage

### 3. Workflow Instance Management

#### **Docker-like Containerization**

```
Workflow Class (Template) → Workflow Instance (Container)
├── Isolated Environment
├── Independent Artifacts
├── Separate Sessions
└── No Cross-Instance Interference
```

**Instance Characteristics**:

- **Isolation**: Each instance operates independently
- **Persistence**: Artifacts and state maintained per instance
- **Scalability**: Multiple instances can run simultaneously
- **Resource Management**: Controlled resource allocation per instance

## Core Components Architecture

### The 7 Core Components

All components are implemented as **Node Classes** in React Flow, with different types but unified architecture:

#### 1. **Agent Node**

```typescript
interface AgentNode {
  id: string;
  type: "agent";
  name: string;
  role: string;
  prompt: string;
  capabilities: string[];
  tasks: TaskNode[];
  metadata: AgentMetadata;
}
```

#### 2. **Agent Team Node**

```typescript
interface AgentTeamNode {
  id: string;
  type: "agent-team";
  name: string;
  agents: AgentNode[];
  workflows: WorkflowNode[];
  collaboration_rules: string;
  metadata: TeamMetadata;
}
```

#### 3. **Task Node**

```typescript
interface TaskNode {
  id: string;
  type: "task";
  name: string;
  description: string;
  input_artifacts: ArtifactNode[];
  output_artifacts: ArtifactNode[];
  logic_prompt: string;
  agent: AgentNode;
  metadata: TaskMetadata;
}
```

#### 4. **Workflow Node**

```typescript
interface WorkflowNode {
  id: string;
  type: "workflow";
  name: string;
  description: string;
  agents: AgentNode[];
  tasks: TaskNode[];
  sequence: Edge[];
  templates: TemplateNode[];
  metadata: WorkflowMetadata;
}
```

#### 5. **Template Node**

```typescript
interface TemplateNode {
  id: string;
  type: "template";
  name: string;
  category: string;
  content: string;
  variables: string[];
  validation_rules: string[];
  metadata: TemplateMetadata;
}
```

#### 6. **Checklist Node**

```typescript
interface ChecklistNode {
  id: string;
  type: "checklist";
  name: string;
  items: ChecklistItem[];
  validation_rules: string[];
  target_artifacts: ArtifactNode[];
  metadata: ChecklistMetadata;
}
```

#### 7. **Data Node**

```typescript
interface DataNode {
  id: string;
  type: "data";
  name: string;
  source: string;
  format: string;
  schema: object;
  access_rules: string[];
  metadata: DataMetadata;
}
```

## User Interface Architecture

### Dual Canvas System

#### 1. **Workflow Building Canvas** (Design Mode)

**Purpose**: Create and configure workflow classes

**Layout Structure**:

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Left Panel    │   Center Panel  │   Right Panel   │
│   (Explorer)    │   (Canvas)      │   (Properties)  │
├─────────────────┼─────────────────┼─────────────────┤
│ • 7 Components  │ • Visual Flow   │ • Node Details  │
│ • Component     │ • Node-Edges    │ • Edit Forms    │
│   Hierarchy     │ • Relationships │ • Validation    │
│ • Drag & Drop   │ • Connections   │ • Preview       │
└─────────────────┴─────────────────┴─────────────────┘
```

**Left Panel (Explorer)**:

- **Component Tree**: Hierarchical view of 7 core components
- **Search & Filter**: Find components quickly
- **Drag & Drop**: Components to canvas
- **Context Menus**: Create, edit, delete components

**Center Panel (Canvas)**:

- **React Flow Canvas**: Visual workflow design
- **Node Types**: Different visual representations for each component type
- **Edge Types**: Sequence, dependency, data flow connections
- **Zoom & Pan**: Navigate complex workflows
- **Grid & Snap**: Professional layout tools

**Right Panel (Properties)**:

- **Node Details**: Edit selected node properties
- **Form Controls**: Rich editing interface
- **Validation**: Real-time error checking
- **Preview**: See how changes affect the workflow

#### 2. **Workflow Execution Canvas** (Runtime Mode)

**Purpose**: Monitor and interact with workflow instances

**Layout Structure**:

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Left Panel    │   Center Panel  │   Right Panel   │
│   (Artifacts)   │   (Status)      │   (Interaction) │
├─────────────────┼─────────────────┼─────────────────┤
│ • Artifact      │ • Workflow      │ • Chat Interface│
│   Explorer      │   Status Flow   │ • Task Controls │
│ • File Browser  │ • Progress      │ • Agent Chat    │
│ • Version       │   Visualization │ • Quick Actions │
│   History       │ • Real-time     │ • Notifications │
└─────────────────┴─────────────────┴─────────────────┘
```

**Left Panel (Artifacts)**:

- **Artifact Browser**: Navigate generated artifacts
- **File Types**: Filter by markdown, flow, etc.
- **Version History**: Track changes over time
- **Search & Tags**: Find artifacts quickly

**Center Panel (Status)**:

- **Workflow Status**: Visual representation of current state
- **Progress Indicators**: Show completion status
- **Active Tasks**: Highlight currently running tasks
- **Artifact Flow**: Show artifact handoffs visually

**Right Panel (Interaction)**:

- **Chat Interface**: Communicate with active agents
- **Task Controls**: Start, pause, resume tasks
- **Quick Actions**: Common workflow operations
- **Notifications**: Real-time updates and alerts

### Navigation and Interaction Patterns

#### **Component Selection Flow**

```
1. Click Component in Explorer
   ↓
2. Canvas Shows Component Structure
   ↓
3. Click Specific Node
   ↓
4. Right Panel Shows Properties
   ↓
5. Edit Properties in Real-time
```

#### **Workflow Execution Flow**

```
1. Select Workflow Instance
   ↓
2. Canvas Shows Current Status
   ↓
3. Click Available Task
   ↓
4. Right Panel Shows Task Interface
   ↓
5. Execute or Modify Task
```

## Advanced Features

### 1. **Dynamic Artifact Visualization**

#### **Template-Driven Node Definition**

Instead of hardcoded TypeScript interfaces, artifact visualizations are defined through JSON templates that users can create and customize:

```json
// Example: IA (Information Architecture) Template
{
  "artifact_type": "ia",
  "name": "Information Architecture",
  "description": "Website structure and navigation",
  "nodes": [
    {
      "id": "page",
      "type": "page-node",
      "label": "Page",
      "properties": {
        "title": { "type": "string", "required": true },
        "url": { "type": "string", "required": true },
        "content": { "type": "text", "required": false }
      },
      "visual": {
        "shape": "rectangle",
        "color": "#4A90E2",
        "icon": "file-text"
      }
    },
    {
      "id": "section",
      "type": "section-node",
      "label": "Section",
      "properties": {
        "name": { "type": "string", "required": true },
        "description": { "type": "text", "required": false }
      },
      "visual": {
        "shape": "rounded-rectangle",
        "color": "#7ED321",
        "icon": "folder"
      }
    }
  ],
  "edges": [
    {
      "id": "navigation",
      "type": "navigation-edge",
      "label": "Navigation",
      "source_types": ["page", "section"],
      "target_types": ["page", "section"],
      "properties": {
        "priority": { "type": "number", "default": 1 },
        "type": { "type": "select", "options": ["primary", "secondary"] }
      },
      "visual": {
        "style": "solid",
        "color": "#333333",
        "arrow": true
      }
    },
    {
      "id": "hierarchy",
      "type": "hierarchy-edge",
      "label": "Hierarchy",
      "source_types": ["section"],
      "target_types": ["page", "section"],
      "properties": {
        "level": { "type": "number", "default": 1 }
      },
      "visual": {
        "style": "dashed",
        "color": "#999999",
        "arrow": true
      }
    }
  ],
  "layouts": [
    {
      "id": "hierarchical",
      "name": "Hierarchical",
      "algorithm": "dagre",
      "options": {
        "direction": "TB",
        "spacing": 50
      }
    },
    {
      "id": "flow",
      "name": "Flow",
      "algorithm": "elk",
      "options": {
        "direction": "LR",
        "spacing": 30
      }
    }
  ]
}
```

#### **Template Editor in Design Mode**

In the Workflow Building Canvas, users can:

1. **Create Artifact Templates**: Define custom node and edge types
2. **Visual Template Builder**: Drag-and-drop interface for creating node/edge definitions
3. **Property Editor**: Define what properties each node/edge should have
4. **Visual Styling**: Choose colors, shapes, icons for nodes and edges
5. **Layout Options**: Define different layout algorithms for the artifact

#### **Template Storage and Management**

```typescript
interface ArtifactTemplate {
  id: string;
  name: string;
  artifact_type: string;
  version: string;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  layouts: LayoutDefinition[];
  metadata: TemplateMetadata;
}

interface NodeDefinition {
  id: string;
  type: string;
  label: string;
  properties: PropertyDefinition[];
  visual: VisualDefinition;
}

interface EdgeDefinition {
  id: string;
  type: string;
  label: string;
  source_types: string[];
  target_types: string[];
  properties: PropertyDefinition[];
  visual: VisualDefinition;
}
```

#### **Runtime Artifact Generation**

When agents execute workflows, they:

1. **Receive Template as Context**: The artifact template is provided as part of the agent's context
2. **Generate Artifact JSON**: Agents create JSON that conforms to the template structure
3. **Dynamic Visualization**: React Flow renders the artifact using the template definitions

```json
// Example: Generated IA Artifact
{
  "template_id": "ia-template-v1",
  "nodes": [
    {
      "id": "home",
      "type": "page",
      "data": {
        "title": "Home Page",
        "url": "/",
        "content": "Welcome to our website"
      }
    },
    {
      "id": "about",
      "type": "page",
      "data": {
        "title": "About Us",
        "url": "/about",
        "content": "Learn about our company"
      }
    }
  ],
  "edges": [
    {
      "id": "home-to-about",
      "source": "home",
      "target": "about",
      "type": "navigation",
      "data": {
        "priority": 1,
        "type": "primary"
      }
    }
  ]
}
```

### 2. **Academy System**

#### **Learning Paths**

- **Beginner**: Understanding AI agents and workflows
- **Intermediate**: Creating simple workflows
- **Advanced**: Complex workflow design and optimization

#### **Interactive Tutorials**

- **Step-by-step guides**: Build workflows incrementally
- **Template exploration**: Learn from pre-built examples
- **Best practices**: Context engineering and prompt design

#### **Community Features**

- **Workflow sharing**: Learn from others' designs
- **Peer review**: Get feedback on workflow designs
- **Expert consultation**: Connect with workflow experts

### 3. **Real-time Collaboration**

#### **Multi-User Support**

- **Shared workflows**: Multiple users can view and edit
- **Conflict resolution**: Handle simultaneous edits
- **User presence**: See who's working on what

#### **Collaboration Patterns**

```
Single Workflow Instance:
├── One user can execute tasks
├── Multiple users can view status
├── Artifacts can be edited by any user
└── Changes are synchronized in real-time
```

## Technical Implementation

### 1. **Session Management**

#### **Session Architecture**

```typescript
interface WorkflowSession {
  id: string;
  workflow_instance_id: string;
  current_task: TaskNode;
  artifacts: ArtifactNode[];
  status: "running" | "paused" | "completed" | "failed";
  metadata: SessionMetadata;
}
```

#### **Session Lifecycle**

```
1. Workflow Instance Created
   ↓
2. Task Execution Started
   ↓
3. Agent Session Established
   ↓
4. Artifact Generated
   ↓
5. Human Review/Edit
   ↓
6. Next Task Execution
   ↓
7. Session Continues or Completes
```

### 2. **Artifact Management**

#### **Storage Strategy**

- **Metadata**: Stored in database for quick access
- **Content**: Stored in file system or cloud storage
- **Versioning**: Git-like version control system
- **Caching**: Frequently accessed artifacts cached

#### **Artifact Operations**

```typescript
interface ArtifactOperations {
  create(content: string, type: string): ArtifactNode;
  edit(artifact: ArtifactNode, changes: object): ArtifactNode;
  version(artifact: ArtifactNode): VersionNode;
  validate(artifact: ArtifactNode): ValidationResult;
  handoff(from: AgentNode, to: AgentNode, artifact: ArtifactNode): void;
}
```

### 3. **React Flow Integration**

#### **Custom Node Types**

```typescript
const CustomNodeTypes = {
  agent: AgentNodeComponent,
  task: TaskNodeComponent,
  workflow: WorkflowNodeComponent,
  artifact: ArtifactNodeComponent,
  template: TemplateNodeComponent,
  checklist: ChecklistNodeComponent,
  data: DataNodeComponent,
};
```

#### **Edge Types**

```typescript
const CustomEdgeTypes = {
  sequence: SequenceEdgeComponent,
  dependency: DependencyEdgeComponent,
  "data-flow": DataFlowEdgeComponent,
  "artifact-flow": ArtifactFlowEdgeComponent,
};
```

## Competitive Advantages

### 1. **Human-Centric Workflow Design**

- **"Work with AI agents like real team members"**
- **Clear handoffs and deliverables between team members**
- **Transparent accountability and responsibility**

### 2. **Artifact Transparency & Control**

- **See exactly what each agent produces**
- **Edit and refine artifacts before passing to next agent**
- **Version control for all deliverables**

### 3. **Scalability & Modularity**

- **Reuse agents across different workflows**
- **Mix and match agents for different projects**
- **Build your own AI team**

### 4. **Educational Approach**

- **"Scratch for AI agents" - learn by doing**
- **Visual feedback and immediate results**
- **Progressive complexity and skill building**

## Implementation Roadmap

### **Phase 1: Core Architecture (MVP)**

- Basic multi-session workflow execution
- Markdown and React Flow artifact support
- Simple workflow building canvas
- Basic agent and task management

### **Phase 2: Enhanced UX**

- Advanced workflow execution canvas
- Real-time collaboration features
- Dynamic artifact visualization
- Academy system foundation

### **Phase 3: Ecosystem Development**

- Plugin system for custom artifacts
- Marketplace for workflow sharing
- Advanced analytics and optimization
- Enterprise features and integrations

---

_Document created: July 22, 2025_
_Architecture version: 1.0_
_Next review: After MVP development_
