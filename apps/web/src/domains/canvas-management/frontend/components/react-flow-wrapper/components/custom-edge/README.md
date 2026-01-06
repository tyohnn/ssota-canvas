# Custom Edge

A custom edge component for React Flow that provides edge rendering, label editing, and toolbar display functionality.

## Structure

Designed with a modular structure following the **Component Development Guidelines**, applying the Container/Presentational pattern and Hook Layer Architecture:

```
custom-edge/
├── components/          # UI Components (Presentational)
│   ├── custom-edge-view.tsx         # Main edge rendering component
│   ├── custom-edge-view.type.ts     # View component type definitions
│   ├── edge-label/                  # Edge label sub-component
│   │   ├── components/
│   │   │   ├── edge-label-view.tsx
│   │   │   └── edge-label-view.type.ts
│   │   ├── core/
│   │   │   ├── types.ts
│   │   │   ├── use-edge-label.ui.ts
│   │   │   ├── use-edge-label.business.ts
│   │   │   └── use-edge-label.ts
│   │   └── index.tsx
│   └── edge-path/                   # Edge path sub-component
│       ├── components/
│       │   ├── edge-path-view.tsx
│       │   └── edge-path-view.type.ts
│       ├── core/
│       │   ├── types.ts
│       │   ├── use-edge-path.ui.ts
│       │   └── use-edge-path.ts
│       └── index.tsx
├── core/                # Business Logic
│   ├── types.ts                         # Type definitions
│   ├── use-custom-edge.ui.ts            # UI state hook
│   └── use-custom-edge.ts               # Main hook (orchestration)
└── index.tsx            # Container component
```

## Architecture Patterns

### Container/Presentational Pattern

1. **Container** (`index.tsx`): Uses hook to get state, passes as props to View
2. **Presentational** (`components/custom-edge-view.tsx`): Renders based on props only (no Hook/Context dependencies)
3. **Sub-components**: `EdgeLabel` and `EdgePath` are independent components with their own Container/Presentational structure

### Props Pattern (Container-Hook-View)

Following the established pattern for props handling:

- **Container (Thin)**: Minimal destructuring, connects Hook → View
- **Hook (Explicit)**: Explicit destructuring of used props
- **View (Semantic Grouping)**: Props grouped by semantic meaning (geometry, pathData, visual, label, toolbar)

### Hook Layer Architecture

This component follows the **Hook Layer Architecture** pattern:

#### 1. UI Hook (`use-custom-edge.ui.ts`)

**Role**: UI state management and visual styling calculations

**Features:**
- ✅ **No business logic**: No API calls, no server actions
- ✅ **Visual state**: Calculates stroke color and width based on selection and theme
- ✅ **Theme integration**: Uses theme dependencies for color calculations

**State:**
- `strokeColor: string` - Edge stroke color (based on theme and selection)
- `strokeWidth: number` - Edge stroke width (based on selection)
- `isSelected: boolean` - Selection state

#### 2. Main Hook (`use-custom-edge.ts`)

**Role**: Dependency injection and orchestration

**Features:**
- ✅ **Dependency gathering**: Gathers all external dependencies (React Flow, Theme, Context)
- ✅ **Orchestration**: Coordinates path calculation, UI state, and label data
- ✅ **Toolbar logic**: Calculates toolbar visibility based on selection state

**Dependencies:**
- `FlowDependencies`: React Flow operations (getEdge, getEdges)
- `ThemeDependencies`: Theme and color utilities
- `SelectionDependencies`: Selection state queries
- `useCanvasMetadata`: Canvas metadata (pageId, orgId, workspaceId)

**Example:**
```tsx
export function useCustomEdge(props: CustomEdgeHookProps): UseCustomEdgeReturn {
  // 1. Gather External Dependencies (Centralized)
  const { getEdge, getEdges } = useReactFlow();
  const { theme } = useTheme();
  const { getSelectionCount } = useCanvasSelection();
  const { pageId, orgId, workspaceId } = useCanvasMetadata();
  
  // 2. Bundle Dependencies into semantic objects
  const flowDeps: FlowDependencies = { getEdge, getEdges };
  const themeDeps: ThemeDependencies = { theme, getHexColor, getHexColorDark };
  const selectionDeps: SelectionDependencies = { getSelectionCount };
  
  // 3. UI State (Designer Area) - Visual state only
  const uiState = useCustomEdgeUI({
    style: props.style,
    selected: props.selected ?? false,
    themeDeps,
  });
  
  // 4. Calculate selection state for toolbar visibility
  const selectedNodeCount = getSelectionCount();
  const selectedEdgeCount = edges.filter(e => e.selected).length;
  const isSingleSelection = /* ... */;
  
  // 5. Get edge label from React Flow
  const label = /* ... */;
  
  // 6. Toolbar visibility and props
  const showToolbar = /* ... */;
  
  return {
    visualState: uiState.visualState,
    label,
    showToolbar,
    toolbarProps,
  };
}
```

## Features

- **Edge Path Rendering**: Supports multiple edge shapes (Bezier, Straight, SmoothStep)
- **Edge Label Editing**: Click-to-edit labels with keyboard shortcuts
- **Edge Toolbar**: Displays editing tools when edge is selected (single selection only)
- **Visual State Management**: Stroke color and width adapt based on selection state
- **Path Calculation**: Calculates edge path and label position (labelX, labelY)

## Usage

### Basic Usage

```tsx
import { CustomEdge } from '@/domains/canvas-management/frontend/components';

// Used as a React Flow edge type
<ReactFlow
  edges={[
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'custom',
      // ... other edge props
    },
  ]}
  edgeTypes={{
    custom: CustomEdge,
  }}
/>
```

## Component Details

### CustomEdgeView

Main presentational component that combines EdgePath and EdgeLabel.

**Props (Semantic Grouping):**
- `geometry: EdgeGeometry` - Edge position and connection data
  - `edgeId: string`
  - `sourceX, sourceY, targetX, targetY: number`
  - `sourcePosition, targetPosition: Position`
- `pathData: EdgePathData` - Label positioning data
  - `labelX: number` - Label X coordinate
  - `labelY: number` - Label Y coordinate
- `visual: EdgeVisual` - Visual styling
  - `strokeColor: string`
  - `strokeWidth: number`
  - `markerEnd?: string`
  - `style?: React.CSSProperties`
- `label: EdgeLabelData` - Label content and state
  - `label: string`
  - `isSelected: boolean`
- `toolbar: EdgeToolbarData` - Toolbar state
  - `showToolbar: boolean`
  - `toolbarProps: EdgeToolbarProps | null`

**Features:**
- Combines `EdgePath` and `EdgeLabel` components
- Conditionally renders `EdgeToolbar` when edge is selected
- Uses `EdgeLabelRenderer` from React Flow for label positioning

### EdgePath Sub-component

Independent component responsible for edge path calculation and rendering.

**Location**: `components/edge-path/`

**Features:**
- Calculates edge path based on shape (Bezier, Straight, SmoothStep)
- Calculates label position (labelX, labelY)
- Force re-render on shape changes
- Supports multiple edge shapes via `actualEdgeShape` data property

**See**: `components/edge-path/README.md` (if exists)

### EdgeLabel Sub-component

Independent component responsible for edge label editing.

**Location**: `components/edge-label/`

**Features:**
- Click-to-edit functionality
- Keyboard shortcuts (Enter to save, Escape to cancel)
- Optimistic updates with automatic rollback

**See**: `components/edge-label/README.md`

## Type Definitions

### EdgeGeometry

```typescript
export type EdgeGeometry = {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
};
```

### EdgePathData

```typescript
export type EdgePathData = {
  labelX: number;
  labelY: number;
};
```

### EdgeVisual

```typescript
export type EdgeVisual = {
  strokeColor: string;
  strokeWidth: number;
  markerEnd?: string;
  style?: React.CSSProperties;
};
```

### EdgeLabelData

```typescript
export type EdgeLabelData = {
  label: string;
  isSelected: boolean;
};
```

### EdgeToolbarData

```typescript
export type EdgeToolbarData = {
  showToolbar: boolean;
  toolbarProps: EdgeToolbarProps | null;
};
```

## Path Calculation

The component calculates edge path and label position in two places:

1. **CustomEdge Container**: Calls `useEdgePath` to get `labelX`, `labelY` for label positioning
2. **EdgePath Component**: Calls `useEdgePath` internally for path rendering

This is intentional:
- `CustomEdge` needs `labelX`, `labelY` for `EdgeLabel` positioning
- `EdgePath` needs path data for rendering
- Both calculations are independent and serve different purposes

## Testing

### Storybook

Presentational component can be tested independently:

```tsx
// custom-edge-view.stories.tsx
export const Default = () => (
  <CustomEdgeView
    geometry={{
      edgeId: "edge-1",
      sourceX: 0,
      sourceY: 0,
      targetX: 100,
      targetY: 100,
      sourcePosition: "right",
      targetPosition: "left",
    }}
    pathData={{
      labelX: 50,
      labelY: 50,
    }}
    visual={{
      strokeColor: "#000",
      strokeWidth: 2,
    }}
    label={{
      label: "Connection",
      isSelected: false,
    }}
    toolbar={{
      showToolbar: false,
      toolbarProps: null,
    }}
  />
);
```

## Design Decisions

### Semantic Grouping of Props

View component receives props grouped by semantic meaning:
- **geometry**: Edge position and connection data
- **pathData**: Label positioning data
- **visual**: Visual styling
- **label**: Label content and state
- **toolbar**: Toolbar state

This improves readability and maintainability.

### Independent Sub-components

`EdgeLabel` and `EdgePath` are independent components with their own:
- Container/Presentational structure
- Hook layer architecture
- Type definitions

This allows them to be:
- Reused in other contexts
- Tested independently
- Maintained separately

### Toolbar Visibility Logic

Toolbar is shown when:
- Edge is selected (`selected === true`)
- Single selection (only one node or edge selected)
- All required IDs are present (pageId, edgeId, orgId, workspaceId)

This ensures toolbar only appears when it's relevant and functional.

### Path Calculation Separation

Path calculation happens in two places:
- `CustomEdge`: For label positioning
- `EdgePath`: For path rendering

This separation ensures:
- Each component gets the data it needs
- No unnecessary prop drilling
- Clear responsibility boundaries

## Related Components

- `EdgeLabel`: Sub-component for label editing
- `EdgePath`: Sub-component for path rendering
- `EdgeToolbar`: Toolbar component for edge editing
- `useCanvasEdgeManagement`: Domain hook providing edge management operations
- `useCanvasMetadata`: Context hook providing canvas metadata
- `useCanvasSelection`: Hook for selection state queries
