# Multi Selection Toolbar

A toolbar component that provides alignment and editing tools for multiple selected blocks on the canvas.

## Structure

Designed with a fractal structure following the **Component Development Guidelines**, applying the Container/Presentational pattern:

```
multi-selection-toolbar/
├── components/          # UI Components (Presentational)
│   ├── arrange-menu/              # Alignment and distribution menu (Popover)
│   │   ├── components/
│   │   │   ├── trigger-button.tsx        # Arrange button
│   │   │   ├── alignments-section.tsx    # Alignment section
│   │   │   └── distribute-section.tsx    # Distribution section
│   │   ├── core/
│   │   │   └── types.ts                  # Type definitions
│   │   └── index.tsx                     # ArrangeMenu component
│   └── toolbar-content.tsx          # Full toolbar content
├── core/                # Business Logic
│   ├── types.ts                         # Type definitions
│   ├── use-multi-selection-toolbar.ui.ts      # UI state hook (for designers)
│   ├── use-multi-selection-toolbar.business.ts # Business logic hook (for engineers)
│   └── use-multi-selection-toolbar.ts          # Combined hook (entry point)
└── index.tsx            # Container component (uses hook directly)
```

## Architecture Patterns

### Container/Presentational Pattern

1. **Container** (`index.tsx`): Uses hook directly to get values and passes them as props
2. **Presentational** (`components/`): **Renders based on props only** (no Hook/Context dependencies)
3. **Core** (`core/`): Separates UI state and business logic

### Context Removal

- **No Context**: Provider/Context pattern removed, hook used directly
- **Presentational components only receive props**: Can be tested independently in Storybook
- **Container converts Hook → Props**: Gets values from hook and passes as props

### Logic Separation

- **UI State** (`.ui.ts`): Pure UI logic such as toolbar position calculation, DOM measurement
- **Business Logic** (`.business.ts`): Domain logic such as block alignment, duplication, deletion
- **Combined Hook** (`.ts`): Integrates UI + Business logic and provides handlers

### Dependency Injection Pattern

Following the **Object-based Dependency Injection** pattern:

- **Entry Hook** (`use-multi-selection-toolbar.ts`): Centralizes all external dependencies
  - React Flow dependencies (`FlowDependencies`): `setNodes`, `deleteElements`
  - Domain dependencies (`DomainDependencies`): `alignBlocks`, `distributeBlocks`, `duplicateMultipleBlocksAndMount`, `exitToDefaultMode`
- **Dependency Bundling**: Dependencies are bundled into semantic objects and injected into sub-hooks
- **Side Effects in Entry Hook**: ESC key handling, pinch zoom prevention are handled in the entry hook

## Features

- **Block Alignment**: Left/Center/Right, Top/Middle/Bottom alignment
- **Block Distribution**: Horizontal/Vertical even distribution
- **Block Duplication**: Duplicate all selected blocks with automatic offset calculation
- **Block Deletion**: Delete all selected blocks (optimistic UI update)
- **Selection Exit**: Exit selection mode via ESC key or toolbar external click

## Rendering Conditions

The toolbar is rendered only when all of the following conditions are met:

1. `isMultiSelectionMode === true`
2. `selectionCount >= 2`
3. `toolbarPosition !== null` (boundary calculation successful)

The `isVisible` flag from the hook combines all these conditions for convenience.

## Usage Examples

### Production (Default)

```tsx
<MultiSelectionToolbar
  pageId={pageId}
  orgId={orgId}
  workspaceId={workspaceId}
/>
// businessLogic omitted → uses default business logic
```

### Test/Mock

```tsx
import { useMockMultiSelectionToolbarBusiness } from './core/use-multi-selection-toolbar.business';

const mockBusiness = useMockMultiSelectionToolbarBusiness();

<MultiSelectionToolbar
  pageId={pageId}
  orgId={orgId}
  workspaceId={workspaceId}
  businessLogic={mockBusiness} // 🧪 Mock logic injection
/>
```

### Storybook (For Designers)

```tsx
import { ToolbarContent } from './components/toolbar-content';

// Testable with props only! No Context needed!
export const Default = () => (
  <ToolbarContent
    onAlign={(type) => console.log('Align:', type)}
    onDistribute={(dir) => console.log('Distribute:', dir)}
    onDuplicate={() => console.log('Duplicate')}
    onDelete={() => console.log('Delete')}
    selectedBlockCount={3}
  />
);

export const WithTwoBlocks = () => (
  <ToolbarContent
    onAlign={(type) => console.log('Align:', type)}
    onDistribute={(dir) => console.log('Distribute:', dir)}
    onDuplicate={() => console.log('Duplicate')}
    onDelete={() => console.log('Delete')}
    selectedBlockCount={2}
  />
);
```

## Key Features

- ✅ **Container/Presentational Separation**: Improved testability
- ✅ **No Context**: Direct hook usage without Provider/Context pattern
- ✅ **Storybook-Friendly**: Testable with props only (no Context/Hook dependencies)
- ✅ **Logic Separation**: UI/Business logic can be tested independently
- ✅ **Mock Support**: Business logic can be injected for testing
- ✅ **Performance Optimization**: `willChange`, `touchAction` optimizations applied
- ✅ **Accessibility**: ESC key support for exiting selection mode
- ✅ **Dependency Injection**: All external dependencies centralized in entry hook
- ✅ **Side Effects Management**: ESC key handling and pinch zoom prevention in hook

## Component Descriptions

### ArrangeMenu

A Popover menu that provides alignment and distribution features. When clicked, the following sections are displayed:

- **Alignments Section**: Left/Center/Right, Top/Middle/Bottom alignment buttons (2 rows)
- **Distribute Section**: Horizontal/Vertical even distribution buttons (disabled when less than 2 blocks selected)

### ToolbarContent

Renders the full toolbar content. Consists of 3 buttons:

1. **ArrangeMenu**: Alignment and distribution features (Popover)
2. **Duplicate**: Duplicate all selected blocks
3. **Delete**: Delete all selected blocks

Wrapped with `TooltipProvider`.

## Hook Usage

**The hook is used directly to get values. Context/Provider pattern is not used.**

The Container (`MultiSelectionToolbar`) uses the `useMultiSelectionToolbar` hook to get values and passes them as props to Presentational components.

### Hook Return Values

- `toolbarPosition`: Toolbar position (screen coordinates)
- `toolbarRef`: Toolbar DOM reference
- `handleAlign`: Alignment handler
- `handleDistribute`: Distribution handler
- `handleDuplicate`: Duplication handler
- `handleDelete`: Deletion handler
- `handleEscape`: Selection exit handler
- `selectedBlockIds`: Array of selected block IDs
- `selectionCount`: Number of selected blocks
- `isMultiSelectionMode`: Whether multi-selection mode is active
- `isVisible`: Whether the toolbar should be visible (combines all visibility conditions)

### Presentational Component Props

- `ArrangeMenu`: `onAlign` (function), `onDistribute` (function), `selectedBlockCount` (number)
- `ToolbarContent`: `onAlign`, `onDistribute`, `onDuplicate`, `onDelete` (functions), `selectedBlockCount` (number)

## Dependency Injection Details

### Entry Hook Responsibilities

The entry hook (`use-multi-selection-toolbar.ts`) centralizes all external dependencies:

1. **Gathers External Dependencies**:
   - React Flow hooks: `useStore`, `useViewport`, `useReactFlow`
   - Domain hooks: `useCanvasBlockTransform`, `useCanvasBlockLifecycle`, `useCanvasMode`, `useCanvasSelection`

2. **Bundles Dependencies**:
   - `FlowDependencies`: React Flow related (`setNodes`, `deleteElements`)
   - `DomainDependencies`: Domain services (`alignBlocks`, `distributeBlocks`, `duplicateMultipleBlocksAndMount`, `exitToDefaultMode`)

3. **Handles Side Effects**:
   - ESC key event listener registration/cleanup
   - Pinch zoom prevention via `usePreventPinchZoom`

4. **Injects into Sub-hooks**:
   - UI hook receives `UIStateDependencies` (selectedNodes, viewport)
   - Business hook receives `FlowDependencies` and `DomainDependencies`

This pattern ensures:
- **Testability**: Sub-hooks can be tested with plain objects
- **Framework Decoupling**: If external libraries change, only entry hook needs updates
- **Architectural Visibility**: Entry hook serves as a manifest of all dependencies
