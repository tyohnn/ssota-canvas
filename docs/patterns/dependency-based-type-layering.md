# Dependency-based Type Layering

This pattern defines the standard for ordering types within a `types.ts` file based on the flow of dependencies. By following this convention, we ensure that types are defined before they are referenced, improving readability and maintainability.

## Ordering Principles

Types should be organized from the most granular (atomic) to the most comprehensive (entry points), following a "bottom-up" logical flow:

1.  **Atomic Types & Re-exports**: The smallest building blocks. Includes primitive aliases, union types, and types re-exported from external libraries.
2.  **Domain Models / Entities**: Core data structures that represent business entities or internal state models.
3.  **Dependency Interfaces**: Contracts for communication with external systems or frameworks (e.g., React Flow dependencies, Store slices).
4.  **Functional / Business Logic Interfaces**: Definitions of behaviors and actions (function signatures) performed by the module.
5.  **Public Entry Points (Props)**: The top-level interface that users of the module interact with first.

## Benefits

### 1. Improved Readability
When reading a file from top to bottom, every type used in a definition has already been defined above it. This reduces the need to jump around the file to find definitions.

### 2. Dependency Visibility
The structure clearly demonstrates how top-level interfaces (like Props) depend on lower-level business logic and external system contracts.

### 3. Standards Compliance
This ordering aligns with engineering standards used in major Silicon Valley tech companies (e.g., Google, Meta), providing a familiar structure for experienced engineers.

## File Template (Boilerplate)

Every `types.ts` file should use the following visual separators and structure:

```typescript
import type { ExternalType } from 'external-library';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

export type { ReExportedType };
export type LocalUnionType = 'option1' | 'option2';

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

export interface CoreDataModel {
  id: string;
  value: number;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * Framework-level dependencies (e.g., React Flow, State Management).
 */
export interface FlowDependencies {
  nodes: any[];
  setNodes: (nodes: any[]) => void;
}

/**
 * Domain-level dependencies (e.g., Internal Service hooks).
 */
export interface DomainDependencies {
  executeAction: () => void;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

/**
 * Defines the core behaviors and domain logic of this module.
 */
export interface ModuleBusinessLogic {
  executeTask: () => Promise<void>;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * Primary interface for external consumers of this module.
 */
export interface ModuleProps {
  id: string;
  businessLogic?: ModuleBusinessLogic;
}
```
