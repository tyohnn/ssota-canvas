# Story Creation Rules

## Overview

This document defines the methodology and best practices for creating user stories in the Xbowl project. Stories follow a systematic approach that ensures complete development context and clear implementation guidance.

## Core Principles

### 1. Development-First Story Design

- Stories must be designed with development workflow in mind
- Follow the established development order: DB Schema → Server Action → Business Logic Component → Hook → UI Component
- Each story element must align with the actual implementation sequence
- Stories should guide developers through the complete implementation process

### 2. Multi-Source Context Integration

- Stories must integrate information from multiple sources:
  - Epic documents (story requirements and acceptance criteria)
  - Domain policies (business rules and constraints)
  - Architect documents (technical context and constraints)
- No information should be invented - all must come from source documents

### 3. Complete Development Context

- Stories must provide complete context for development teams
- Development agents should not need to read additional documents
- All technical requirements must be explicitly defined
- All business rules must be clearly stated

## Story Development Methodology

### Development Order and Sequence

#### 1. Database Schema First (Foundation Layer)

- **Purpose**: Define data structure and relationships
- **Implementation Order**: 1st
- **Key Activities**:
  - Define database tables and columns
  - Establish relationships and constraints
  - Set up indexes and performance optimizations
  - Define data validation rules
- **Deliverables**: Database schema updates, migration scripts
- **Validation**: Schema validation, relationship integrity

#### 2. Server Actions (Backend Logic Layer)

- **Purpose**: Implement server-side business logic
- **Implementation Order**: 2nd
- **Key Activities**:
  - Create server actions for data operations
  - Implement business logic and validation
  - Set up error handling and logging
  - Define API contracts and responses
- **Deliverables**: Server action functions, validation schemas
- **Validation**: Server action testing, error handling

#### 3. Business Logic Components (Server Components)

- **Purpose**: Server-side data processing and logic
- **Implementation Order**: 3rd
- **Key Activities**:
  - Create server components for data fetching
  - Implement business logic processing
  - Set up data transformation and formatting
  - Handle server-side state management
- **Deliverables**: Server components, data processing logic
- **Validation**: Server component testing, data flow validation

#### 4. Custom Hooks (Client Logic Layer)

- **Purpose**: Client-side state management and side effects
- **Implementation Order**: 4th
- **Key Activities**:
  - Create custom hooks for state management
  - Implement client-side business logic
  - Handle user interactions and events
  - Manage client-side data caching
- **Deliverables**: Custom hooks, state management logic
- **Validation**: Hook testing, state management validation

#### 5. UI Components (Presentation Layer)

- **Purpose**: User interface and user interactions
- **Implementation Order**: 5th
- **Key Activities**:
  - Create UI components for user interface
  - Implement user interactions and events
  - Handle responsive design and accessibility
  - Integrate with hooks and server components
- **Deliverables**: UI components, user interface
- **Validation**: UI testing, user interaction validation

### Story Structure Components

#### Story Header

- **Purpose**: Main story information and business context
- **Content**: User story format, business value, user perspective
- **Focus**: What the user wants to achieve and why

#### Acceptance Criteria

- **Purpose**: Measurable success criteria for the story
- **Content**: Specific, testable requirements
- **Focus**: How to validate that the story is complete

#### Development Tasks

- **Purpose**: Implementation tasks following development order
- **Content**: Technical tasks aligned with development sequence
- **Focus**: What needs to be built and in what order

#### Technical Context

- **Purpose**: Technical requirements and constraints
- **Content**: Architecture, patterns, and technical decisions
- **Focus**: How to implement the story technically

### Development Note Node

- **Purpose**: Development notes and technical context
- **Required Fields**: name, noteType, content
- **Optional Fields**: sourceDocument, relevance, priority
- **Rules**:
  - Must be extracted from architect documents or domain policies
  - Must not invent information
  - Must include source document references
  - Must be relevant to story implementation
  - Must provide clear technical guidance

### Testing Requirement Node

- **Purpose**: Testing requirements and standards
- **Required Fields**: name, testType, requirement
- **Optional Fields**: testFramework, testLocation, coverage
- **Rules**:
  - Must be derived from architect documents and testing standards
  - Must align with acceptance criteria
  - Must include test framework and location
  - Must specify coverage requirements
  - Must include test scenarios

### Architectural Context Node

- **Purpose**: Architectural context and constraints
- **Required Fields**: name, contextType, description
- **Optional Fields**: sourceDocument, constraints, dependencies
- **Rules**:
  - Must be extracted from architect documents
  - Must include source document references
  - Must specify constraints and dependencies
  - Must provide implementation guidelines
  - Must align with system architecture

### Domain Policy Node

- **Purpose**: Domain policy requirements and rules
- **Required Fields**: name, policyType, requirement
- **Optional Fields**: sourceDocument, enforcement, exceptions
- **Rules**:
  - Must be extracted from domain policy documents
  - Must include source document references
  - Must specify enforcement requirements
  - Must include exceptions and constraints
  - Must align with business rules

## Development Relationships and Dependencies

### Implementation Dependencies

#### Database → Server Actions

- **Relationship**: Server actions depend on database schema
- **Dependency Type**: Data structure dependency
- **Implementation**: Server actions must align with database schema
- **Validation**: Schema changes must be reflected in server actions

#### Server Actions → Business Logic Components

- **Relationship**: Business logic components depend on server actions
- **Dependency Type**: Functionality dependency
- **Implementation**: Business logic components use server actions for data operations
- **Validation**: Server actions must be tested before business logic components

#### Business Logic Components → Custom Hooks

- **Relationship**: Custom hooks depend on business logic components
- **Dependency Type**: Data flow dependency
- **Implementation**: Custom hooks consume data from business logic components
- **Validation**: Business logic must be validated before hook implementation

#### Custom Hooks → UI Components

- **Relationship**: UI components depend on custom hooks
- **Dependency Type**: State and interaction dependency
- **Implementation**: UI components use hooks for state management and interactions
- **Validation**: Hooks must be tested before UI component integration

### Cross-Layer Dependencies

#### Data Flow Dependencies

- **Server to Client**: Data flows from server components to client components
- **Validation**: Server-side validation before client-side validation
- **Error Handling**: Server errors must be handled before client errors

#### State Management Dependencies

- **Server State**: Server-side state must be established before client state
- **Client State**: Client state depends on server state availability
- **Synchronization**: Client state must synchronize with server state

#### Component Hierarchy Dependencies

- **Layout Components**: Must be implemented before page components
- **Page Components**: Must be implemented before logic components
- **Logic Components**: Must be implemented before client components

### Testing Dependencies

#### Unit Testing Order

1. **Database Layer**: Schema and data validation tests
2. **Server Actions**: Server action functionality tests
3. **Business Logic**: Business logic component tests
4. **Custom Hooks**: Hook functionality and state tests
5. **UI Components**: Component rendering and interaction tests

#### Integration Testing Order

1. **Database + Server Actions**: Data flow integration
2. **Server Actions + Business Logic**: Business logic integration
3. **Business Logic + Custom Hooks**: State management integration
4. **Custom Hooks + UI Components**: User interaction integration
5. **End-to-End**: Complete user flow testing

## Story Creation Process

### 1. Epic Analysis

- Load and analyze epic document completely
- Extract story sequence and numbering
- Identify next story in sequence
- Extract acceptance criteria for the story
- Identify domain information and technical requirements

### 2. Domain Policy Analysis

- Identify story's primary and related domains from epic
- Load only relevant domain policy documents:
  - Primary domain policy document
  - Related domain policy documents (if applicable)
  - Cross-domain policy documents (if applicable)
- Extract only story-relevant business rules and constraints
- Identify only story-relevant data validation requirements
- Extract only story-relevant user interaction patterns
- Identify only story-relevant security and privacy requirements

### 3. Architect Document Analysis

- Based on story type, identify and load only relevant architect documents:
  - **UI/Frontend stories**: page-structure-v*.json, component-layer-canvas-*.json
  - **Backend/API stories**: db-schema.json, service-architecture.json
  - **Full-stack stories**: All relevant architect documents
  - **Testing stories**: test-case-\*.json and related testing documents
- Extract only story-relevant page structure and routing requirements
- Identify only story-relevant database schema and relationships
- Extract only story-relevant component hierarchy and interactions
- Identify only story-relevant system architecture constraints
- Extract only story-relevant testing standards and requirements

### 4. Development Task Design

- Design database schema tasks based on story requirements
- Design server action tasks for data operations
- Design business logic component tasks for server-side processing
- Design custom hook tasks for client-side state management
- Design UI component tasks for user interface
- Ensure tasks follow the established development order

### 5. Implementation Dependencies Design

- Design database → server action dependencies
- Design server action → business logic component dependencies
- Design business logic component → custom hook dependencies
- Design custom hook → UI component dependencies
- Design cross-layer dependencies and data flow
- Ensure all dependencies follow the development sequence

### 6. Testing Strategy Design

- Design unit testing tasks for each development layer
- Design integration testing tasks for layer interactions
- Design end-to-end testing tasks for complete user flows
- Ensure testing follows the development order
- Align testing with acceptance criteria validation

### 7. Project Structure Analysis and Validation

- Analyze current project structure to determine story necessity
- Check existing implementation status for story requirements
- Validate if story is needed based on current project state
- Determine if story should be created, modified, or skipped

#### 7.1 Project Structure Assessment

- **Check existing files**: Analyze current implementation in project folders
- **Identify gaps**: Determine what's missing vs. what's already implemented
- **Assess complexity**: Evaluate if story requirements are already partially implemented
- **Review dependencies**: Check if prerequisite stories or components exist

#### 7.2 Implementation Status Check

- **Database layer**: Check if required database schema already exists
- **Server actions**: Check if required server actions are already implemented
- **Business logic**: Check if required business logic components exist
- **Custom hooks**: Check if required custom hooks are already available
- **UI components**: Check if required UI components are already implemented

#### 7.3 Story Necessity Validation

- **Skip if implemented**: If all story requirements are already implemented, skip story creation
- **Modify if partial**: If some requirements are implemented, modify story to focus on gaps
- **Create if needed**: If no requirements are implemented, create complete story
- **Prioritize if blocked**: If story is blocked by missing dependencies, prioritize accordingly

### 8. Story Document Creation

- Create story document with development-focused structure
- Include all development tasks in proper sequence
- Include all implementation dependencies
- Include testing strategy and validation approach
- Ensure story guides developers through complete implementation
- Include project structure analysis results and necessity justification

## Validation Rules

### Development Order Validation

- All development tasks must follow the established order: DB Schema → Server Action → Business Logic Component → Hook → UI Component
- Each development layer must be completed before moving to the next layer
- Dependencies between layers must be properly identified and respected
- Implementation sequence must be clear and logical

### Technical Implementation Validation

- All technical requirements must be derived from architect documents
- All business rules must be derived from domain policies
- All development tasks must be implementable and actionable
- All technical constraints must be properly documented

### Dependency Validation

- All implementation dependencies must be properly identified
- Cross-layer dependencies must follow the development sequence
- Data flow dependencies must be clearly defined
- Testing dependencies must align with development order

### Story Completeness Validation

- All epic requirements must be addressed through development tasks
- All acceptance criteria must be covered by implementation tasks
- All development tasks must contribute to story completion
- All testing requirements must validate story functionality

### Project Structure Validation

- Story necessity must be validated against current project structure
- Existing implementation status must be properly assessed
- Story scope must be adjusted based on current project state
- Dependencies and prerequisites must be properly identified

## Quality Standards

### Development Guidance

- Story must provide clear development guidance for each layer
- All development tasks must be actionable and implementable
- All implementation dependencies must be clearly defined
- All testing requirements must be comprehensive

### Technical Accuracy

- All technical requirements must be derived from source documents
- All business rules must be accurately represented
- All architectural constraints must be properly documented
- All implementation patterns must be consistent

### Implementation Clarity

- All development tasks must be clearly defined
- All dependencies must be clearly stated
- All testing requirements must be unambiguous
- All validation criteria must be clearly specified

### Development Consistency

- Story must follow established development patterns
- Story must align with architectural decisions
- Story must maintain consistency with existing codebase
- Story must follow established testing strategies

## Best Practices

### Development Task Design

- Design tasks that follow the established development order
- Ensure each task is specific and actionable
- Include clear acceptance criteria for each task
- Provide sufficient technical context for implementation

### Dependency Management

- Clearly identify all implementation dependencies
- Ensure dependencies follow the development sequence
- Document cross-layer dependencies and data flow
- Validate that all dependencies are necessary

### Testing Strategy

- Design testing tasks that align with development order
- Include unit tests for each development layer
- Include integration tests for layer interactions
- Include end-to-end tests for complete user flows

### Technical Context Integration

- Extract only relevant technical information from source documents
- Include clear implementation guidance for each task
- Document architectural decisions and constraints
- Provide clear validation criteria for each development layer

### Project Structure Analysis

- Always analyze current project structure before creating stories
- Check existing implementation status to avoid duplication
- Validate story necessity based on current project state
- Adjust story scope based on existing implementation gaps

## Common Pitfalls

### Information Invention

- Do not invent technical details not in source documents
- Do not assume requirements not explicitly stated
- Do not create constraints not documented
- Always use source document information

### Incomplete Context

- Do not create stories without complete context
- Do not skip architect document analysis
- Do not ignore domain policy requirements
- Ensure all context is properly integrated

### Poor Relationships

- Do not create unnecessary relationships
- Do not skip relationship analysis
- Do not ignore dependencies and constraints
- Ensure all relationships are meaningful

### Template Violation

- Do not deviate from template structure
- Do not skip required fields
- Do not use invalid node or edge types
- Ensure complete template compliance

### Project Structure Ignorance

- Do not create stories without analyzing current project structure
- Do not ignore existing implementation when creating stories
- Do not create duplicate stories for already implemented features
- Do not skip project structure validation before story creation
