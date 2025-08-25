# Canvas Domain Policy

## Executive Summary

This document defines the domain policies for the Canvas domain, establishing the business rules, constraints, and governance framework that ensure consistent behavior and maintain domain integrity for visual interface and interaction management through canvas pages and blocks.

**Key Highlights:**

- Total Policies: 18
- Critical Policies: 11
- High Priority Policies: 5
- Domain Owner: Canvas Domain Owner
- Next Review: 2025-02-22

## Domain Context and Boundaries

### Domain Overview

This section provides the context and boundaries for the Canvas domain, including its purpose, scope, and relationship to other domains.

### Domain Purpose

The Canvas domain is responsible for managing the visual interface and interaction system that enables users to design and interact with AI agent workflows through an intuitive canvas page and block system. It handles the dual view system (Canvas View and Agent Setup View), Block Editor overlay system for block metadata editing, drag-and-drop functionality, visual block management, AI chat interface integration, and real-time visual feedback with progressive block generation.

### Domain Boundaries

- **In Scope**: Canvas page rendering, block interactions, canvas view management, agent setup view management, Block Editor overlay system, z-index overlay management, block metadata editing interfaces, AI chat interface integration, real-time visual feedback, visual block relationships, canvas state management, visual customization, progressive block generation
- **Out of Scope**: Individual agent execution (Agent domain), workflow orchestration (Workflow domain), user authentication (User domain), artifact template structure definition (Artifact Template domain), execution runtime (Execution domain), block metadata schema validation (Task domain), AI conversation logic (AI domain)
- **Boundaries**: Clear separation between visual representation (Canvas domain) and logical workflow execution (Workflow/Execution domains), with canvas providing visual interface for workflow design and monitoring through canvas pages and blocks

### Key Entities

- **Canvas Page**: The visual workspace where users design workflows through block interactions, supporting both empty canvas pages and predefined workflow core pages
- **Canvas View**: AI-integrated mode where users chat with AI while manipulating canvas pages and blocks
- **Agent Setup View**: Workflow creation mode with 7 predefined workflow core pages for agent workflow design
- **Block**: Visual elements on canvas pages representing any block type (pages are also blocks) with the 7 core types (agent, task, workflow, template, checklist, data, output) and runtime-generated blocks
- **Block Connection**: Visual connections between blocks representing hierarchical relationships, input/output edges, and data flow
- **Canvas State**: The current state of the canvas including block positions, connections, view mode, and Block Editor state
- **Visual Style**: Styling and appearance definitions for visual elements
- **Interaction State**: Current interaction state including selections, drag operations, hover states, and Block Editor interactions
- **Block Editor**: Z-index overlay panels for block metadata editing with context-aware forms
- **Overlay System**: Management system for z-index overlays and panel coordination
- **Progressive Renderer**: System for real-time block generation and rendering during execution
- **AI Chat Interface**: Integrated chat system for AI-assisted canvas page manipulation
- **View Switcher**: UI component for switching between Canvas View and Agent Setup View

### Ubiquitous Language

- **Canvas Page**: The visual workspace where users design workflows through block interactions, with support for nested canvas pages and AI-assisted manipulation
- **Canvas View**: Primary mode where users interact with AI through chat interface while manipulating canvas pages and blocks with natural language commands
- **Agent Setup View**: Specialized mode for creating agent workflows with 7 predefined workflow core pages (agent, task, workflow, template, checklist, data, output)
- **Block**: A visual element on canvas pages representing any block type, where pages themselves are also blocks (everything is a block in the visual system)
- **Workflow Core Pages**: The 7 predefined page types in Agent Setup View (Agent Page, Task Page, Workflow Page, Template Page, Checklist Page, Data Page, Output Page)
- **Block Connection**: Visual connection between blocks representing hierarchical parent-child relationships, task input/output edges (input, output), workflow control edges (next), and template containment edges (contains)
- **Drag-and-Drop**: Primary interaction method for creating and configuring workflow blocks on canvas pages
- **Real-time Feedback**: Immediate visual updates as workflow execution progresses and blocks are generated
- **Progressive Rendering**: Blocks appear on canvas pages as they're generated with their defined styles and relationships
- **Block Editor**: Z-index overlay panel that appears when clicking blocks on canvas pages, providing context-aware metadata editing forms and connected blocks visualization in alternative 2D rendering
- **Overlay System**: Management system for z-index overlays ensuring proper layering, focus management, and panel coordination
- **Block Metadata Editing**: Process of configuring block-specific metadata through specialized forms (Agent: persona/role, Task: markdown/variables, etc.)
- **Alternative 2D Rendering**: Different visual representation of the canvas within Block Editor panels, showing connected blocks and relationships
- **Context-Aware Forms**: Dynamic form interfaces that adapt based on the selected block type and its metadata schema
- **Page Explorer**: Navigation panel showing available canvas pages and blocks for navigation and selection
- **Block Toolbox**: Context-specific tools for specialized blocks (Start/Conditional/End for Workflow, Block/Edge/Column Definition placement for Template)
- **Canvas Block Management System**: Integrated system for managing canvas-specific block addition with handler pattern architecture and dynamic block selection
- **Canvas Block Definition**: Type definition for blocks that can be added to specific canvas types (workflow canvas: start/end/branch/condition, task canvas: dynamic categories)
- **Dynamic Block Selection**: Flow for selecting existing workspace blocks through hover → list → select interaction pattern
- **Block Handler**: Component responsible for handling specific block addition logic with strategy pattern separation
- **Handler Pattern**: Architectural pattern separating block creation logic by type (WorkflowBlockHandler, DynamicCategoryHandler, DynamicBlockHandler)
- **Dynamic Category**: Special block type in task canvas that triggers block selection flow rather than direct creation
- **Block Search and Filtering**: System for finding existing workspace blocks with filtering by type, category, and reusability
- **Create New Option**: Special option in dynamic block selection that allows creating new blocks alongside existing ones
- **Block Recommendation Engine**: System providing contextual block suggestions based on canvas state and block relationships
- **AI Chat Interface**: Integrated conversational interface allowing users to manipulate canvas pages and blocks through natural language commands
- **View Switcher**: UI control located in top-right for switching between Canvas View and Agent Setup View modes

## Block Metadata Schemas and Editor Panel Specifications

### Agent Block Configuration Requirements

**Purpose**: Define AI agents with comprehensive persona definitions for consistent workflow execution

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Agent Name**: The name we use when communicating with this agent

  - **Business Rule**: Must be unique within the workspace to avoid confusion
  - **Format Requirements**: Clear, professional naming for human communication
  - **User Experience**: Textarea input with immediate feedback if name already exists
  - **Field Type**: Required

- **Agent Role**: Position and responsibilities within the company/team structure
  - **Business Rule**: Must provide clear role definition for organizational context
  - **User Experience**: Single-line textarea input
  - **Field Type**: Required

**Optional Persona Customization:**

- **Agent Style**: Thinking and working style characteristics

  - **User Experience**: Single-line textarea input
  - **Business Value**: Defines how the agent approaches problems and tasks
  - **Field Type**: Optional

- **Agent Identity**: Core identity and professional characteristics

  - **User Experience**: Single-line textarea input
  - **Business Value**: Establishes the agent's professional persona
  - **Field Type**: Optional

- **Agent Focus**: Key points and priorities the agent should concentrate on

  - **User Experience**: Single-line textarea input
  - **Business Value**: Guides agent attention and decision-making
  - **Field Type**: Optional

- **Core Principles**: Detailed thought processes and guiding principles
  - **User Experience**: Multi-line textarea input with YAML formatting support
  - **Business Value**: Provides deep behavioral and decision-making framework
  - **Field Type**: Optional
  - **Format**: YAML structure with principle names and descriptions

**Agent Persona Example Structure:**

```yaml
persona:
  role: Holistic System Architect & Full-Stack Technical Leader
  style: Comprehensive, pragmatic, user-centric, technically deep yet accessible
  identity: Master of holistic application design who bridges frontend, backend, infrastructure
  focus: Complete systems architecture, cross-stack optimization, pragmatic technology selection
  core_principles:
    - Holistic System Thinking - View every component as part of a larger system
    - User Experience Drives Architecture - Start with user journeys and work backward
    - Pragmatic Technology Selection - Choose boring technology where possible
```

**System-Managed Information:**

- Creation date, creator identity, modification history, and version tracking (automatically handled)

**Agent Relationships:**

- **Contains Other Blocks**: Agents can organize and manage Tasks, Data sources, Checklists, and Templates
- **Visual Organization**: Related items appear grouped under the agent in a hierarchical structure

---

### Task Block Configuration Requirements

**Purpose**: Define specific work assignments that agents will execute within workflows

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Task Name**: Human-readable label that appears in the interface

  - **Business Rule**: Must be between 1-100 characters for clarity
  - **User Experience**: Single-line text input with character count display
  - **Field Type**: Required

- **Task Slug**: Programmatic identifier for agents and systems (auto-generated)

  - **Business Rule**: Automatically generated from task name
  - **Format Requirements**: Lowercase letters and hyphens only
  - **User Experience**: Hidden input field, auto-generated
  - **Field Type**: Auto-generated, read-only

- **Task Instructions**: Detailed step-by-step instructions for the agent to follow
  - **Business Rule**: Must provide meaningful instructions for agent execution
  - **User Experience**: Multi-line textarea with markdown support (future: Milkdown MD)
  - **Business Value**: Content that will be included in agent prompts
  - **Field Type**: Required

**Optional Information:**

- **Task Description**: Human-readable explanation of the task purpose
  - **Business Rule**: Optional but recommended for clarity
  - **User Experience**: Two-line textarea for human understanding
  - **Field Type**: Optional

**Task Workflow Integration:**

- **Receives Input From**: Data sources, Checklists, results from other Tasks, or Templates
- **Produces Output To**: Generates artifacts that can be used by other tasks
- **Visual Design**: Input connections appear on the left, output connections on the right

---

### Workflow Block Configuration Requirements

**Purpose**: Define the overall process flow that orchestrates agents, tasks, and decision points

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Workflow Name**: Human-readable label that appears in the interface

  - **Business Rule**: Must be between 1-100 characters for clarity
  - **User Experience**: Single-line text input with character count display
  - **Field Type**: Required

- **Workflow Slug**: Programmatic identifier for agents and systems (auto-generated)
  - **Business Rule**: Automatically generated from workflow name
  - **Format Requirements**: Lowercase letters and hyphens only
  - **User Experience**: Hidden input field, auto-generated
  - **Field Type**: Auto-generated, read-only

**Optional Information:**

- **Workflow Description**: Human-readable explanation of the workflow purpose
  - **Business Rule**: Optional but recommended for clarity
  - **User Experience**: Two-line textarea for human understanding
  - **Field Type**: Optional

**Workflow Organization:**

- **Contains Blocks**: Can organize Agents, Tasks, Artifacts, control points, and even other Workflows
- **Flow Connections**: Links between workflow steps that define the execution sequence

---

### Template Block Configuration Requirements

**Purpose**: Define the structure and format for documents and outputs that agents will create

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Template Identifier**: A simple, unique name for developers to reference this template

  - **Business Rule**: Must be unique within the workspace to avoid confusion
  - **Format Requirements**: Simple, professional naming (lowercase letters and hyphens only)
  - **User Experience**: Clear text input with immediate feedback if name already exists

- **Template Display Name**: The human-readable name that appears in the interface

  - **Business Rule**: Must be between 1-100 characters for clarity
  - **User Experience**: Simple text field with character count display

- **Output Format Type**: What kind of document or structure this template creates
  - **Business Rule**: Must select one of the available format types
  - **Available Options**: Visual Flow, Text Document, Data Table, or Custom Format
  - **User Experience**: Clear dropdown selection with format descriptions
  - **Business Value**: Ensures agents create outputs in the expected format

**Format-Specific Configuration:**

- **For Visual Flow Templates**: Layout and visual arrangement settings
  - **Configuration Options**: Direction, spacing, block arrangement, and padding
  - **Business Value**: Controls how visual outputs are organized

**Template Building Tools (Available When Designing Templates):**

- **Custom Block Designer** (for visual flow templates):

  - **Purpose**: Define what types of blocks appear in the visual output

- **Configuration**: Block properties, AI instructions, and appearance settings

  - **Business Value**: Creates consistent, professional-looking visual outputs

- **Connection Designer** (for visual flow templates):

  - **Purpose**: Define how blocks connect to each other in visual outputs
  - **Configuration**: Connection styles, properties, and behaviors

- **Column Designer** (for data table templates):
  - **Purpose**: Define the columns and data structure for table outputs
  - **Configuration**: Column names, data types, requirements, and validation rules

**Automatic Integration:**

- When you create a template, the system automatically creates a corresponding artifact type that can be used in workflows

---

### Checklist Block Configuration Requirements

**Purpose**: Create quality assurance and validation checklists for workflow processes

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Checklist Name**: Human-readable label that appears in the interface

  - **Business Rule**: Must be between 1-100 characters for clarity
  - **User Experience**: Single-line text input with character count display
  - **Field Type**: Required

- **Checklist Slug**: Programmatic identifier for agents and systems (auto-generated)

  - **Business Rule**: Automatically generated from checklist name
  - **Format Requirements**: Lowercase letters and hyphens only
  - **User Experience**: Hidden input field, auto-generated
  - **Field Type**: Auto-generated, read-only

- **Checklist Instructions**: Detailed list of items to check or validate
  - **Business Rule**: Must provide meaningful checklist items for validation
  - **User Experience**: Multi-line textarea with markdown support (future: Milkdown MD)
  - **Business Value**: Content that will be included in agent prompts for validation
  - **Field Type**: Required

**Optional Information:**

- **Checklist Description**: Human-readable explanation of the checklist purpose
  - **Business Rule**: Optional but recommended for clarity
  - **User Experience**: Two-line textarea for human understanding
  - **Field Type**: Optional

**Current Capabilities:**

- **Standalone Operation**: Functions independently without connections to other blocks
- **Future Enhancements**: Will support nested checklists and automated validation rules

---

### Data Block Configuration Requirements

**Purpose**: Store and manage reference information and data sources for workflows

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Data Name**: Human-readable label that appears in the interface

  - **Business Rule**: Must be between 1-100 characters for clarity
  - **User Experience**: Single-line text input with character count display
  - **Field Type**: Required

- **Data Slug**: Programmatic identifier for agents and systems (auto-generated)

  - **Business Rule**: Automatically generated from data name
  - **Format Requirements**: Lowercase letters and hyphens only
  - **User Experience**: Hidden input field, auto-generated
  - **Field Type**: Auto-generated, read-only

- **Data Content**: The actual information, documentation, or reference material
  - **Business Rule**: Must provide meaningful content for agent access
  - **User Experience**: Multi-line textarea with markdown support (future: Milkdown MD)
  - **Business Value**: Content that will be included in agent prompts
  - **Field Type**: Required

**Optional Information:**

- **Data Description**: Human-readable explanation of the data source purpose
  - **Business Rule**: Optional but recommended for clarity
  - **User Experience**: Two-line textarea for human understanding
  - **Field Type**: Optional

**File Upload Support (Future Enhancement):**

- **File Upload**: Support for file attachments
  - **Business Value**: Allows direct file content as data source
  - **User Experience**: File upload interface with drag-and-drop
  - **Metadata Extraction**: File type, size, and other properties automatically extracted
  - **Display**: File information shown as read-only metadata

**Current Capabilities:**

- **Standalone Operation**: Functions independently without connections to other blocks
- **Future Enhancements**: Will support data relationships and cross-references

---

### Output Block Configuration Requirements

**Purpose**: Represent the types of outputs that can be created and shared between tasks

**Business Requirements:**

**Essential Information (Must Be Provided):**

- **Output Type Identifier**: A simple, unique name for developers to reference this output type
- **Output Type Display Name**: The human-readable name that appears in the interface
- **Output Type Description**: Optional explanation of what this output type represents

**System Integration:**

- **Automatic Creation**: Generated automatically when you create a Template Block
- **Workflow Integration**: Can receive outputs from tasks and provide inputs to other tasks
- **Design vs Execution**: Represents planned artifacts during design, actual artifacts during execution

## Canvas Page and Block Architecture

### Canvas Page = Block Principle

**Core Concept**: Every visual element in the system is a block, including canvas pages themselves. This creates a consistent, nested structure where pages can contain blocks, and those blocks can be other canvas pages.

**Business Context**: This architecture enables users to create complex, nested workflows with consistent interaction patterns across all levels of the hierarchy.

**Implementation Details:**

- **Everything is a Block**: Canvas pages, workflow blocks, and all visual elements are blocks in the database (same Node table)
- **Nested Canvas Pages**: Canvas pages can contain other canvas page blocks, creating hierarchical structures
- **Consistent Interaction**: All blocks use the same interaction patterns regardless of their type or nesting level
- **Page Navigation**: Users can navigate between canvas pages through block interactions
- **State Preservation**: Each canvas page maintains its own state, zoom level, and viewport position

**Visual Behavior:**

- **Unified Rendering**: All blocks use consistent visual patterns and interaction models
- **Hierarchical Display**: Parent-child relationships are visually represented through containment
- **Cross-Page Navigation**: Users can navigate between canvas pages through visual connections
- **Context Preservation**: Canvas state is preserved when switching between pages

### Canvas View vs Agent Setup View

**Core Concept**: Two distinct interaction modes providing different experiences for different use cases - AI-assisted general canvas manipulation vs structured agent workflow creation.

**Business Context**: This dual-mode approach serves both casual users who want AI assistance and power users who need structured workflow design tools.

**Canvas View Implementation:**

- **AI Chat Integration**: Primary interface includes conversational AI for canvas manipulation
- **Natural Language Commands**: Users can create, modify, and organize blocks through chat
- **Flexible Canvas Pages**: No predefined structure, users can create any type of canvas page
- **Conversational UX**: AI guides users through canvas operations and provides suggestions

**Agent Setup View Implementation:**

- **Structured Environment**: 7 predefined workflow core pages for systematic agent workflow creation
- **Traditional UI**: Similar to current design mode with toolboxes and panels
- **Workflow-Focused**: Optimized specifically for creating agent workflows with the 7 core block types
- **Power User Tools**: Advanced features for complex workflow design

**View Switching:**

- **Top-Right Toggle**: View switcher for seamless mode transitions
- **State Preservation**: Canvas state is maintained when switching between views
- **Context Adaptation**: UI adapts appropriately to the selected view mode

### 7 Workflow Core Pages in Agent Setup View

**Core Concept**: Agent Setup View provides 7 predefined canvas page types optimized for agent workflow creation, each with specialized tools and interfaces.

**Business Context**: This structured approach ensures users create complete, well-organized agent workflows by providing dedicated spaces for each workflow block type.

**Predefined Page Types:**

1. **Agent Page**: Canvas page for defining AI agents with personality and role configuration
2. **Task Page**: Canvas page for defining specific work assignments with detailed instructions
3. **Workflow Page**: Canvas page for orchestrating the overall process flow
4. **Template Page**: Canvas page for defining output structures and formats
5. **Checklist Page**: Canvas page for quality assurance and validation procedures
6. **Data Page**: Canvas page for managing reference information and data sources
7. **Output Page**: Canvas page for managing result types and artifact classes

**Page-Specific Features:**

- **Specialized Toolboxes**: Each page type has relevant tools and blocks in the Block Toolbox
- **Contextual Block Editor**: Block Editor adapts to the page type and selected blocks
- **Workflow Integration**: Pages are designed to work together in cohesive agent workflows
- **Template-Driven**: Each page type has predefined templates and best practices

### Block Creation and Interaction Patterns

**Core Concept**: Consistent interaction patterns for creating and manipulating blocks across all canvas pages and view modes.

**Canvas View Interactions:**

- **AI-Assisted Creation**: Users describe what they want, AI creates appropriate blocks
- **Natural Language Commands**: "Create an agent block for customer support" → AI generates configured agent block
- **Conversational Refinement**: Users can iterate on blocks through follow-up conversations
- **Smart Suggestions**: AI suggests related blocks and connections based on context

**Agent Setup View Interactions:**

- **Traditional Creation**: Drag-and-drop from Page Explorer and Block Toolbox
- **Form-Based Configuration**: Block Editor provides structured forms for metadata
- **Visual Connections**: Direct manipulation of block connections and relationships
- **Workflow Templates**: Predefined patterns for common workflow structures

**Universal Patterns:**

- **Block Selection**: Click to select, background highlighting for active blocks
- **Block Editor Access**: Click selected blocks to open metadata editing overlay
- **Connection Creation**: Drag from connection points to create relationships
- **Context Menus**: Right-click for additional block operations

## Canvas View AI Integration

### AI Chat Interface Integration

**Core Concept**: Canvas View integrates a conversational AI interface that allows users to manipulate canvas pages and blocks through natural language commands.

**Business Context**: This integration makes workflow design accessible to non-technical users while maintaining the power and flexibility of visual design tools.

**Implementation Details:**

- **Persistent Chat Panel**: AI chat interface remains available throughout Canvas View interactions
- **Context-Aware Responses**: AI understands current canvas state and can reference specific blocks and pages
- **Command Interpretation**: Natural language commands are translated into canvas operations
- **Visual Feedback**: AI operations provide immediate visual feedback on the canvas
- **Conversational Memory**: AI maintains context of previous interactions and canvas changes

**AI Capabilities:**

- **Block Creation**: "Add a task block for data processing" → Creates and configures task block
- **Block Modification**: "Change the agent's personality to be more friendly" → Updates agent metadata
- **Relationship Creation**: "Connect the data source to the processing task" → Creates visual connection
- **Canvas Organization**: "Organize these blocks in a logical flow" → Rearranges blocks optimally
- **Workflow Guidance**: "What should I add next?" → Suggests next steps based on current state

**User Experience:**

- **Natural Language**: Users can describe intentions rather than learning interface mechanics
- **Iterative Refinement**: Conversational flow allows for gradual workflow development
- **Learning Support**: AI explains concepts and best practices during interaction
- **Error Prevention**: AI validates actions and suggests alternatives for problematic operations

## Business Rules and Policies

### Canvas View AI Integration Rule

**Business Context:**
Canvas View must provide seamless integration between AI chat interface and visual canvas manipulation, ensuring users can effectively create and modify workflows through conversational interaction.

**Rule Logic:**

- AI chat interface must be persistently available in Canvas View mode
- AI commands must translate to immediate visual feedback on canvas pages
- AI must maintain context of current canvas state and previous interactions
- All AI-generated blocks must follow the same validation rules as manually created blocks
- AI responses must provide clear feedback about actions taken and results achieved
- Canvas state must be preserved and synchronized between AI commands and manual operations

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: AI integration validation and canvas state synchronization
- **Applicable Entities**: AI Chat Interface, Canvas State Management, Block Creation Logic
- **Business Owner**: Canvas Domain Owner

### View Mode Management Rule

**Business Context:**
The system must maintain clear separation between Canvas View (AI-assisted) and Agent Setup View (structured workflow design), ensuring users understand the current context and available capabilities.

**Rule Logic:**

- System must operate in exactly one view mode at a time: Canvas View or Agent Setup View
- Canvas View must provide AI chat interface integration for natural language canvas manipulation
- Agent Setup View must provide structured interface with 7 predefined workflow core pages
- View transitions must be explicit and user-initiated through the top-right view switcher
- Canvas state must be preserved when switching between view modes
- UI must adapt appropriately to the current view mode

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: View mode state management and UI adaptation
- **Applicable Entities**: View Switcher, Canvas View Interface, Agent Setup View Interface
- **Business Owner**: Canvas Domain Owner

### Canvas Page and Block Management Rule

**Business Context:**
All visual elements must be treated as blocks in a consistent hierarchy, where canvas pages are also blocks, enabling nested structures and consistent interaction patterns.

**Rule Logic:**

- Every visual element must be a block, including canvas pages themselves
- All blocks must use the same Node table in the database
- Canvas pages can contain other canvas page blocks, creating hierarchical structures
- Block interactions must be consistent regardless of block type or nesting level
- Page navigation must be possible through block interactions and relationships
- Block metadata must be editable through the Block Editor regardless of block type

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Database schema consistency and block interaction validation
- **Applicable Entities**: Block Management System, Canvas Page Hierarchy, Database Schema
- **Business Owner**: Canvas Domain Owner

### Block Editor Overlay Management Rule

**Business Context:**
Block Editor overlays must provide context-aware metadata editing interfaces for different block types, ensuring users can efficiently configure block metadata through specialized forms while maintaining visual context with the main canvas.

**Rule Logic:**

- Block Editor must appear as z-index overlay when clicking any block on canvas pages
- Panel content must be context-aware based on the clicked block type (Agent: persona/role forms, Task: markdown/variables forms, etc.)
- Panel must show connected blocks visualization in alternative 2D rendering
- Only one Block Editor can be open at a time to maintain focus and clarity
- Panel must provide real-time metadata validation and immediate updates to the Universal Node System
- Panel must be dismissible through explicit user action (close button, ESC key, click outside)
- Panel state must be preserved during view mode transitions when appropriate

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Block Editor state management and overlay coordination
- **Applicable Entities**: Block Editor, Overlay System, Block Metadata Editing, Context-Aware Forms
- **Business Owner**: Canvas Domain Owner

### Workflow Core Pages Management Rule

**Business Context:**
Agent Setup View must provide 7 predefined workflow core pages that enable systematic creation of agent workflows with specialized tools and interfaces for each page type.

**Rule Logic:**

- Agent Setup View must provide exactly 7 predefined workflow core pages
- Each page type must have specialized Block Toolbox content relevant to its purpose
- Page types must be: Agent Page, Task Page, Workflow Page, Template Page, Checklist Page, Data Page, Output Page
- Each page must support the same basic block operations (create, edit, delete, connect)
- Block Editor must adapt its interface based on the current page type and selected block
- Page navigation must be available through Page Explorer and block connections
- Canvas state must be maintained separately for each workflow core page

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Page type validation and specialized interface provision
- **Applicable Entities**: Agent Setup View, Workflow Core Pages, Block Toolbox, Page Explorer
- **Business Owner**: Canvas Domain Owner

### Block Creation Workflow Rule

**Business Context:**
Block creation must support both AI-assisted creation in Canvas View and traditional creation in Agent Setup View, ensuring consistent results regardless of creation method.

**Rule Logic:**

- Canvas View must support AI-assisted block creation through natural language commands
- Agent Setup View must support traditional drag-and-drop block creation from toolboxes
- All created blocks must undergo the same validation regardless of creation method
- AI-created blocks must be immediately visible and editable like manually created blocks
- Block creation must trigger appropriate canvas state updates and visual feedback
- Created blocks must automatically conform to the current canvas page's context and constraints

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Block creation validation and method-agnostic processing
- **Applicable Entities**: AI Command Processing, Traditional Block Creation, Block Validation
- **Business Owner**: Canvas Domain Owner

### AI Command Processing Rule

**Business Context:**
AI commands in Canvas View must be processed accurately and safely, with proper validation and user feedback to ensure reliable canvas manipulation through natural language.

**Rule Logic:**

- AI commands must be validated for feasibility before execution
- All AI operations must provide immediate visual feedback on canvas
- AI must maintain context of current canvas state and previous interactions
- Invalid or unsafe commands must be rejected with explanatory feedback
- AI operations must follow the same business rules as manual operations
- Command processing must be atomic - either complete successfully or fail cleanly
- AI must provide clear explanation of actions taken and their effects

**Implementation Details:**

- **Priority**: High
- **Enforcement**: AI command validation and execution monitoring
- **Applicable Entities**: AI Command Processor, Canvas State Validator, Visual Feedback System
- **Business Owner**: Canvas Domain Owner

### Block Connection Management Rule

**Business Context:**
Visual connections between blocks must accurately represent the specific edge types (input, output, next, contains) defined in the Universal Node System and provide clear visual feedback for hierarchical relationships, data flow, and execution sequence.

**Rule Logic:**

- Block connections must be created through approved interaction methods with edge type validation
- Connections must validate against specific edge type definitions and block type constraints
- Visual connections must immediately reflect their corresponding Universal Node System relationships
- Connection routing must avoid visual clutter and maintain readability
- Visual feedback must be provided for connection creation, modification, and deletion
- Connection validation must prevent invalid relationships and circular references
- Both AI-assisted and manual connection creation must follow the same validation rules

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Connection validation and visual routing
- **Applicable Entities**: Block Connection System, Edge Type Validation, Visual Routing Engine
- **Business Owner**: Canvas Domain Owner

### Real-time Visual Feedback Rule

**Business Context:**
The canvas must provide immediate visual feedback for all user interactions and AI operations, ensuring users understand the current state and can make informed decisions.

**Rule Logic:**

- All user interactions must provide immediate visual feedback
- AI operations must provide real-time visual updates as they execute
- System state changes must be reflected in visual blocks within 100ms
- Visual feedback must be clear, consistent, and non-intrusive
- Progress indicators must be provided for long-running operations
- Error states must be clearly communicated through visual indicators
- Success states must be confirmed through appropriate visual feedback

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Real-time update system and visual feedback mechanisms
- **Applicable Entities**: Visual Feedback System, Real-Time Updates, Progress Indicators
- **Business Owner**: Canvas Domain Owner

### Canvas State Persistence Rule

**Business Context:**
Canvas state including block positions, connections, and visual preferences must be persisted and restored consistently across view mode transitions and user sessions.

**Rule Logic:**

- Canvas state must be automatically saved during user interactions and AI operations
- State persistence must include block positions, connections, view mode, and visual preferences
- State restoration must be accurate and complete across view mode switches
- Canvas page state must be maintained separately for different pages
- State conflicts must be resolved through clear user choice
- State versioning must be maintained for compatibility and recovery

**Implementation Details:**

- **Priority**: High
- **Enforcement**: State persistence system and conflict resolution
- **Applicable Entities**: Canvas State Manager, State Persistence Layer, Conflict Resolution
- **Business Owner**: Canvas Domain Owner

### Page Explorer Navigation Rule

**Business Context:**
Page Explorer must provide intuitive navigation between canvas pages and blocks, supporting both flat and hierarchical page structures with clear visual indicators.

**Rule Logic:**

- Page Explorer must display all accessible canvas pages and blocks in current workspace
- Page hierarchy must be visually represented through indentation and grouping
- Active page must be clearly highlighted with distinct visual styling
- Page navigation must preserve state of previous pages
- Page search and filtering must be available for large page collections
- Page creation options must be contextually appropriate to current view mode

**Implementation Details:**

- **Priority**: High
- **Enforcement**: Navigation state management and visual hierarchy
- **Applicable Entities**: Page Explorer, Navigation State, Page Hierarchy Renderer
- **Business Owner**: Canvas Domain Owner

### Block Toolbox Context Management Rule

**Business Context:**
Block Toolbox must adapt contextually based on the current view mode and page type, providing appropriate tools and preventing invalid block creation scenarios.

**Rule Logic:**

- Canvas View must show general-purpose block creation options suitable for AI assistance
- Agent Setup View must show specialized tools based on current workflow core page type
- Toolbox must prevent creation of invalid block combinations for current context
- Visual feedback must indicate valid drop zones for drag-and-drop operations
- Tool availability must reflect user permissions and workspace constraints
- Context switching must preserve current editing state when appropriate

**Implementation Details:**

- **Priority**: Critical
- **Enforcement**: Context-aware UI state management and validation
- **Applicable Entities**: Block Toolbox, Context Manager, Tool Validation System
- **Business Owner**: Canvas Domain Owner

### Canvas Performance Optimization Rule

**Business Context:**
Canvas performance must be optimized to handle complex nested page structures and AI operations while maintaining smooth user interactions and real-time feedback.

**Rule Logic:**

- Canvas must handle 10+ blocks per page smoothly without performance degradation
- AI operations must complete within reasonable time limits with progress feedback
- Page navigation must be instant with state preservation
- Visual rendering must be optimized for nested page structures
- Memory usage must be managed efficiently for large page hierarchies
- Performance monitoring must be in place for optimization

**Implementation Details:**

- **Priority**: High
- **Enforcement**: Performance monitoring and optimization systems
- **Applicable Entities**: Performance Monitor, Memory Manager, Rendering Optimizer
- **Business Owner**: Canvas Domain Owner

### Canvas Security Rule

**Business Context:**
Canvas interactions must be secure and respect user permissions, ensuring users can only perform actions they're authorized to perform, including AI-assisted operations.

**Rule Logic:**

- Canvas interactions must validate user permissions for all operations
- AI commands must respect the same permission constraints as manual operations
- Canvas page access must be controlled based on workspace membership and permissions
- Block metadata must be protected according to sensitivity and user roles
- AI operations must be logged and auditable for security compliance
- Cross-page navigation must respect page-level access controls

**Implementation Details:**

- **Priority**: High
- **Enforcement**: Security validation and access control
- **Applicable Entities**: Permission Validator, Security Logger, Access Control Manager
- **Business Owner**: Canvas Domain Owner

## Data Validation and Integrity

### Block Metadata Schema Validation

**Validation Scope:**

- **Field/Entity**: Individual block metadata fields and complete schemas
- **Validation Type**: Field-level and schema-level validation
- **Validation Criteria**: Required fields present, field formats correct, schema completeness validated

**User Experience:**

- **Error Message**: "Block metadata invalid: [specific field] - [validation issue]"
- **Severity Level**: High
- **Real-time Feedback**: Field-level validation with immediate visual feedback

**Technical Considerations:**

- **Performance Impact**: Low - client-side validation with server-side confirmation
- **Applicable Entities**: Block Metadata Schema, Form Validation, Field Validation
- **Dependencies**: Block type definitions and metadata schemas

**Block-Specific Validations:**

- **Agent Block**: Slug format, persona/role character minimums
- **Task Block**: Description length, variable name format validation
- **Workflow Block**: Flow control block connection validation
- **Template Block**: Format-specific field requirements

### AI Command Validation

**Validation Scope:**

- **Field/Entity**: AI commands and their translation to canvas operations
- **Validation Type**: Command feasibility and safety validation
- **Validation Criteria**: Command syntax valid, operations feasible, permissions sufficient

**User Experience:**

- **Error Message**: "AI command cannot be executed: [reason] - [suggestion]"
- **Severity Level**: Medium
- **Real-time Feedback**: Immediate feedback with alternative suggestions

**Technical Considerations:**

- **Performance Impact**: Medium - AI processing with validation pipeline
- **Applicable Entities**: AI Command Processor, Operation Validator, Permission Checker
- **Dependencies**: AI model capabilities and canvas operation definitions

### Canvas State Validation

**Validation Scope:**

- **Field/Entity**: Canvas state consistency across view modes and page transitions
- **Validation Type**: State integrity and consistency validation
- **Validation Criteria**: Block positions valid, connections consistent, mode state correct

**User Experience:**

- **Error Message**: "Canvas state invalid: [state issue] - attempting recovery"
- **Severity Level**: Critical

**Technical Considerations:**

- **Performance Impact**: Low - validation during state changes
- **Applicable Entities**: Canvas State Manager, State Validator, Recovery System
- **Dependencies**: View mode definitions and page structure rules

## Access Control and Security

### Canvas Page Access Control

**Access Control Scope:**

- **Protected Resource**: Canvas pages and their contained blocks
- **Controlled Action**: View, create, modify, delete, navigate
- **Authorized Roles**: Page owners, workspace members, authorized viewers

**Access Conditions:**

- Users can only access canvas pages within authorized workspaces
- Page modifications require appropriate edit permissions
- AI operations must respect the same access controls as manual operations
- Cross-page navigation must validate access to target pages

**Security Considerations:**

- **Priority Level**: High
- **Audit Required**: Yes - all page access and modifications
- **Applicable Entities**: Canvas Page, Page Access Controller, Navigation Security
- **Security Owner**: Canvas Domain Owner

### AI Operation Access Control

**Access Control Scope:**

- **Protected Resource**: AI-assisted canvas operations and commands
- **Controlled Action**: Execute AI commands, modify blocks via AI, access AI features
- **Authorized Roles**: AI-enabled users, workspace members with AI permissions

**Access Conditions:**

- AI command execution requires AI feature permissions
- AI operations must respect block-level and page-level permissions
- AI command history must be auditable and traceable
- AI operations must validate user authority for each requested action

**Security Considerations:**

- **Priority Level**: High
- **Audit Required**: Yes - all AI operations and their effects
- **Applicable Entities**: AI Command Processor, AI Permission Validator, AI Audit Logger
- **Security Owner**: Canvas Domain Owner

### Block Editor Access Control

**Access Control Scope:**

- **Protected Resource**: Block Editor overlays and metadata editing interfaces
- **Controlled Action**: Open editor, edit metadata, save changes, access sensitive fields
- **Authorized Roles**: Block editors, workflow designers, authorized metadata editors

**Access Conditions:**

- Editor opening requires appropriate block access permissions
- Metadata editing requires specific block type editing permissions
- Sensitive metadata fields require elevated permissions
- Editor access must respect block ownership and sharing permissions

**Security Considerations:**

- **Priority Level**: High
- **Audit Required**: Yes - all metadata editing operations
- **Applicable Entities**: Block Editor, Metadata Permission Validator, Edit Audit Logger
- **Security Owner**: Canvas Domain Owner

## Domain Events and Notifications

### Policy Enforcement Events

- **Event**: CanvasViewActivated
- **Trigger**: User switches to Canvas View mode
- **Policy**: View Mode Management Rule, AI Integration Rule
- **Action**: Enable AI chat interface, validate AI permissions, adapt UI for conversational interaction

- **Event**: AgentSetupViewActivated
- **Trigger**: User switches to Agent Setup View mode
- **Policy**: View Mode Management Rule, Workflow Core Pages Management Rule
- **Action**: Display 7 workflow core pages, adapt toolboxes, disable AI chat interface

- **Event**: AICommandReceived
- **Trigger**: User submits AI command in Canvas View
- **Policy**: AI Command Processing Rule, Canvas Security Rule
- **Action**: Validate command feasibility, check permissions, execute operation, provide feedback

- **Event**: BlockCreatedViaAI
- **Trigger**: AI successfully creates block from user command
- **Policy**: Block Creation Workflow Rule, Real-time Visual Feedback Rule
- **Action**: Validate block creation, update canvas state, provide visual confirmation

- **Event**: BlockEditorOpened
- **Trigger**: User clicks on canvas block to open Block Editor
- **Policy**: Block Editor Overlay Management Rule, Block Access Control
- **Action**: Validate block access permissions, render context-aware form, display connected blocks visualization

- **Event**: CanvasPageNavigated
- **Trigger**: User navigates to different canvas page
- **Policy**: Canvas Page and Block Management Rule, Page Explorer Navigation Rule
- **Action**: Preserve current page state, load target page state, update navigation indicators

- **Event**: BlockConnectionEstablished
- **Trigger**: Visual connection created between blocks with specific edge type
- **Policy**: Block Connection Management Rule, Real-time Visual Feedback Rule
- **Action**: Validate edge type compatibility, update visual routing, establish relationship

- **Event**: WorkflowCorePageAccessed
- **Trigger**: User accesses specific workflow core page in Agent Setup View
- **Policy**: Workflow Core Pages Management Rule, Block Toolbox Context Management Rule
- **Action**: Adapt Block Toolbox content, configure page-specific tools, validate page access

### Notification and Alerting

- **Policy Violation Alerts**: Real-time notifications for canvas state violations, AI operation failures, security breaches
- **AI Operation Feedback**: Immediate notifications for AI command results, suggestions, and error explanations
- **Escalation Procedures**: Automatic escalation for critical canvas issues, manual review for AI operation problems

### Integration Points

- **External Systems**: AI domain for command processing, Workflow domain for workflow integration, Agent domain for agent visualization
- **Monitoring Tools**: Real-time dashboard for canvas performance, AI operation success rates, user interaction metrics
- **Reporting**: Automated reports on canvas usage, AI feature adoption, block creation patterns, user experience metrics

## Compliance and Governance

### Regulatory Compliance

### Applicable Regulations

- Web accessibility guidelines (WCAG) for visual interface compliance
- Data protection regulations for canvas state and AI interaction data
- AI governance requirements for AI-assisted operations and command processing
- Software licensing requirements for canvas blocks and AI integration

### Compliance Monitoring

- **Regular Audits**: Monthly accessibility reviews, quarterly AI operation assessments
- **Compliance Reports**: Automated reporting on accessibility compliance, AI operation compliance, user experience scores
- **Remediation Procedures**: Automated remediation for minor issues, manual review for AI-related compliance problems

## Change History

- **Version 1.0** (2025-07-24): Initial policy definition
- **Version 1.1** (2025-07-27): Added Canvas Rendering Strategy Pattern, Automatic Relationship Generation, and new edge type "accesses"
- **Version 1.2** (2025-01-27): Fixed Edge Type Definitions to include Artifact Template as valid input for Tasks
- **Version 1.3** (2025-01-27): Added Canvas Block Management System with Handler Pattern Architecture
- **Version 2.0** (2025-01-27): Major terminology update - Canvas Pages and Blocks architecture
  - Replaced "Node" terminology with "Block" in user-facing contexts
  - Introduced Canvas Page concept where pages are also blocks
  - Added Canvas View vs Agent Setup View distinction
  - Integrated AI Chat Interface for Canvas View
  - Defined 7 Workflow Core Pages for Agent Setup View
  - Updated all business rules and policies to reflect new architecture
  - Maintained database Node table usage internally
  - Added comprehensive AI operation policies and validation rules

## References

- Project Brief: xbowl - Scratch for AI Agents
- Domain Definitions: docs/domains.json
- Technical Architecture: Core architecture documentation
- AI Integration Guidelines: AI domain policy documentation
- Accessibility Guidelines: WCAG 2.1 compliance requirements

## Contact Information

- **Domain Owner**: Canvas Domain Owner
- **Policy Questions**: canvas-policy@xbowl.com
- **Technical Support**: canvas-support@xbowl.com
- **AI Integration Support**: ai-canvas-support@xbowl.com
