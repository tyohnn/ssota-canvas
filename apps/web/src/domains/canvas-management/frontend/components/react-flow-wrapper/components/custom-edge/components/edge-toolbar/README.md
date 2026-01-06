# Edge Toolbar

A toolbar component that provides editing tools for a selected edge on the canvas.

## Structure

Designed with a modular structure following the **Component Development Guidelines**, applying the Container/Presentational pattern:

```
edge-toolbar/
├── components/          # UI Components (Presentational)
│   ├── shape-selector.tsx        # Edge shape selection UI
│   ├── width-selector.tsx        # Edge width selection UI
│   └── edge-toolbar-view.tsx      # Main toolbar layout
├── core/                # Business Logic
│   ├── types.ts                         # Type definitions
│   ├── use-edge-toolbar.ui.ts          # UI state hook (for designers)
│   ├── use-edge-toolbar.business.ts    # Business logic hook (for engineers)
│   └── use-edge-toolbar.ts             # Combined hook (entry point)
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

- **UI State** (`.ui.ts`): Pure UI logic such as toolbar ref management
- **Business Logic** (`.business.ts`): Domain logic such as edge shape/color/width updates, deletion
- **Combined Hook** (`.ts`): Integrates UI + Business logic and provides handlers

### Dependency Injection Pattern

The entry hook (`use-edge-toolbar.ts`) follows the **Object-based Dependency Injection** pattern:

1. **Gathers all external dependencies** in one place (React Flow, Theme, Domain hooks)
2. **Bundles dependencies** into semantic objects (`FlowDependencies`, `DomainDependencies`, `ThemeDependencies`)
3. **Injects dependencies** into UI and Business hooks

This makes the hooks testable and framework-agnostic.

## Features

- **Edge Shape Change**: Popover with icon-only shape selection (default, straight, smoothstep)
- **Edge Color Change**: Reuses `ColorToolbarItem` component for color selection
- **Edge Width Change**: Popover with 3 width options (thin, medium, thick)
- **Delete Button**: Deletes the selected edge with red styling and tooltip
- **Zoom-based Visibility**: Toolbar conditionally renders based on zoom level (returns `null` when zoom is below 100%)

## Usage

### Basic Usage

```tsx
import { EdgeToolbar } from '@/domains/canvas-management/frontend/components';

<EdgeToolbar
  pageId="page-123"
  edgeId="edge-456"
  orgId="org-789"
  workspaceId="workspace-012"
/>
```

### With Mock Business Logic (Storybook/Testing)

```tsx
import { EdgeToolbar } from '@/domains/canvas-management/frontend/components';
import { useMockEdgeToolbarBusiness } from './core/use-edge-toolbar.business';

const mockBusiness = useMockEdgeToolbarBusiness();

<EdgeToolbar
  pageId="page-123"
  edgeId="edge-456"
  orgId="org-789"
  workspaceId="workspace-012"
  businessLogic={mockBusiness}
/>
```

## Component Details

### ShapeSelector

Presentational component for edge shape selection. Uses uncontrolled Popover (managed by Radix UI internally).

**Props:**
- `currentShape: EdgeShape` - Current edge shape
- `onShapeChange: (shape: EdgeShape) => void` - Handler for shape change

### WidthSelector

Presentational component for edge width selection. Uses uncontrolled Popover (managed by Radix UI internally).

**Props:**
- `currentWidth: number` - Current edge width
- `onWidthChange: (width: EdgeWidth) => void` - Handler for width change

### EdgeToolbarView

Main presentational component that combines all toolbar items.

**Props:**
- `edgeId: string` - Edge ID
- `currentShape: EdgeShape` - Current edge shape
- `currentColorToken: ColorToken` - Current color token
- `currentWidth: number` - Current edge width
- `onShapeChange: (shape: EdgeShape) => Promise<void>` - Shape change handler
- `onColorChange: (colorToken: ColorToken) => Promise<void>` - Color change handler
- `onWidthChange: (width: EdgeWidth) => Promise<void>` - Width change handler
- `onDelete: () => Promise<void>` - Delete handler
- `toolbarRef: React.RefObject<HTMLDivElement | null>` - Toolbar DOM reference
- `isZoomVisible: boolean` - Whether toolbar should be visible based on zoom level
- `zoom: number` - Current zoom level

**Behavior:**
- Returns `null` when `isZoomVisible` is `false` (conditional rendering instead of CSS `hidden`)
- Uses `ToolbarIconButton` for the delete button to match the design of other toolbar option triggers
- Delete button has custom red styling: `hover:bg-red-50! hover:text-red-700!` with red icon colors
- Toolbar uses `gap-1` spacing and `justify-center` for centered alignment

## Type Definitions

### EdgeShape

Re-exported from domain value object for consistency:

```typescript
export type EdgeShape = EdgeShapeType; // 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier'
```

### EdgeWidth

```typescript
export type EdgeWidth = 1 | 2 | 3;
```

### EdgeState

```typescript
export interface EdgeState {
  shape: EdgeShape;
  colorHex: string;
  colorToken: ColorToken;
  width: number;
}
```

## Testing

### Storybook

Presentational components can be tested independently in Storybook:

```tsx
// shape-selector.stories.tsx
export const Default = () => (
  <ShapeSelector
    currentShape="default"
    onShapeChange={(shape) => console.log('Shape changed:', shape)}
  />
);
```

### Unit Testing

Business logic can be tested with mock dependencies:

```tsx
const mockFlowDeps: FlowDependencies = { getEdge: jest.fn() };
const mockDomainDeps: DomainDependencies = { /* ... */ };
const mockThemeDeps: ThemeDependencies = { /* ... */ };

const business = useEdgeToolbarBusiness(mockFlowDeps, mockDomainDeps, mockThemeDeps);
```

## Design Decisions

### Uncontrolled Popovers

Popovers use Radix UI's internal state management (uncontrolled mode). This simplifies the code by removing the need for manual state management. Popovers automatically close after selection.

### Conditional Rendering for Zoom

The toolbar uses conditional rendering (`null` return) instead of CSS `hidden` class when zoom is below 100%. This approach:
- Completely removes the toolbar from the DOM when not needed
- Prevents event handlers from firing unnecessarily
- Improves performance by not rendering invisible elements

### Consistent Button Design

All toolbar buttons (including the delete button) use `ToolbarIconButton` component to maintain consistent design:
- Same size (`size-8`) and icon size (`size-5`)
- Same tooltip positioning (`top` with `5px` offset)
- Delete button has custom red styling while maintaining the same structure

### Dependency Injection

All external dependencies are gathered in the entry hook and injected as objects. This makes the hooks:
- **Testable**: Can inject mock dependencies
- **Framework-agnostic**: Business logic doesn't depend on React Flow directly
- **Maintainable**: Clear dependency manifest in one place

### Type Reuse

Edge shape type is re-exported from the domain value object to ensure consistency between frontend and domain layers.

## Related Components

- `CustomEdge`: Uses `EdgeToolbar` to display editing tools when an edge is selected
- `ColorToolbarItem`: Reused for edge color selection
- `useCanvasEdgeManagement`: Provides edge management operations
