# Edge Label

A component that provides edge label editing functionality with click-to-edit and keyboard shortcuts.

## Structure

Designed with a modular structure following the **Component Development Guidelines**, applying the Container/Presentational pattern and Hook Layer Architecture:

```
edge-label/
├── components/          # UI Components (Presentational)
│   ├── edge-label-view.tsx         # Main label rendering component
│   └── edge-label-view.type.ts     # View component type definitions
├── core/                # Business Logic
│   ├── types.ts                         # Type definitions
│   ├── use-edge-label.ui.ts            # UI state hook
│   ├── use-edge-label.business.ts      # Business logic hook
│   └── use-edge-label.ts               # Main hook (orchestration)
└── index.tsx            # Container component
```

## Architecture Patterns

### Container/Presentational Pattern

1. **Container** (`index.tsx`): Uses hook to get state and handlers, passes as props
2. **Presentational** (`components/edge-label-view.tsx`): Renders based on props only (no Hook/Context dependencies)
3. **Core** (`core/`): Separates UI state and business logic

### Props Pattern (Container-Hook-View)

Following the established pattern for props handling:

- **Container (Thin)**: Minimal destructuring, connects Hook → View
- **Hook (Explicit)**: Explicit destructuring of used props
- **View (Semantic Grouping)**: Props grouped by semantic meaning (state, position, handlers, visual)

### Hook Layer Architecture

This component follows the **Hook Layer Architecture** pattern:

#### 1. UI Hook (`use-edge-label.ui.ts`)

**Role**: UI state management and UI-related calculations

**Features:**
- ✅ **No business logic**: No API calls, no server actions
- ✅ **Local state**: `useState` for editing state, draft label, input ref
- ✅ **UI calculations**: Label visibility logic, input width calculations

**State:**
- `isEditing: boolean` - Whether label is in edit mode
- `draftLabel: string` - Temporary label value during editing
- `inputRef: RefObject<HTMLInputElement>` - Reference to input element

#### 2. Business Hook (`use-edge-label.business.ts`)

**Role**: Provides edge label update operations

**Features:**
- ✅ **Uses domain hooks**: Calls `useCanvasEdgeManagement` for edge label updates
- ✅ **Component-specific**: Provides label update workflow
- ✅ **Mock support**: Includes `useMockEdgeLabelBusiness` for testing/Storybook

**Dependencies:**
- `DomainDependencies`: Edge management operations (updateEdgeLabel)

**Example:**
```tsx
export function useEdgeLabelBusiness(
  domainDeps: DomainDependencies
): EdgeLabelBusinessLogic {
  const updateLabel = useCallback(
    async (edgeId: string, label: string): Promise<boolean> => {
      return await domainDeps.updateEdgeLabel(edgeId, label);
    },
    [domainDeps]
  );
  return { updateLabel };
}
```

#### 3. Main Hook (`use-edge-label.ts`)

**Role**: Dependency injection and orchestration of UI/Business hooks

**Features:**
- ✅ **Dependency injection**: Business logic can be optionally injected (testing, Mock support)
- ✅ **Orchestration**: Connects UI hook and Business hook to provide integrated logic
- ✅ **Context integration**: Uses `useCanvasMetadata` for pageId, orgId, workspaceId

**Example:**
```tsx
export function useEdgeLabel(
  props: EdgeLabelHookProps,
  businessLogic?: EdgeLabelBusinessLogic // 🎯 Optional injection
): UseEdgeLabelReturn {
  // 1. Gather External Dependencies (Centralized)
  const { pageId, orgId, workspaceId } = useCanvasMetadata(
    props.canvasMetadata // Optional override for testing
  );
  
  const edgeManagement = useCanvasEdgeManagement({
    pageId,
    orgId,
    workspaceId,
  });
  
  // 2. Bundle Dependencies
  const domainDeps: DomainDependencies = {
    updateEdgeLabel: edgeManagement.updateEdgeLabel,
  };
  
  // 3. UI State
  const uiState = useEdgeLabelUI({ label: props.label });
  
  // 4. Business Logic (or injected logic)
  const defaultBusiness = useEdgeLabelBusiness(domainDeps);
  const business = businessLogic ?? defaultBusiness;
  
  // 5. Combined handlers
  const handleLabelClick = useCallback(() => {
    uiState.setIsEditing(true);
    uiState.setDraftLabel(props.label);
  }, [uiState, props.label]);
  
  // ...
}
```

## Features

- **Click to Edit**: Click on label to enter edit mode
- **Keyboard Shortcuts**:
  - `Enter`: Save label changes
  - `Escape`: Cancel editing and revert to original label
- **Auto-focus**: Input automatically focuses when entering edit mode
- **Dynamic Width**: Input width adjusts based on label length
- **Visibility Logic**: Label is shown when:
  - Label text exists, OR
  - Edge is selected, OR
  - Label is being edited
- **Optimistic Updates**: Label updates immediately with automatic rollback on error

## Usage

### Basic Usage

```tsx
import { EdgeLabel } from '@/domains/canvas-management/frontend/components';

<EdgeLabel
  edgeId="edge-123"
  label="Connection Label"
  position={{ x: 100, y: 50 }}
  isSelected={true}
/>
```

### With Mock Business Logic (Storybook/Testing)

```tsx
import { EdgeLabel } from '@/domains/canvas-management/frontend/components';
import { useMockEdgeLabelBusiness } from './core/use-edge-label.business';

const mockBusiness = useMockEdgeLabelBusiness();

<EdgeLabel
  edgeId="edge-123"
  label="Connection Label"
  position={{ x: 100, y: 50 }}
  isSelected={true}
  businessLogic={mockBusiness}
/>
```

### With Canvas Metadata Override (Testing)

```tsx
<EdgeLabel
  edgeId="edge-123"
  label="Connection Label"
  position={{ x: 100, y: 50 }}
  isSelected={true}
  canvasMetadata={{
    pageId: "test-page",
    orgId: "test-org",
    workspaceId: "test-workspace",
  }}
/>
```

## Component Details

### EdgeLabelView

Presentational component that renders the label in read or edit mode.

**Props (Semantic Grouping):**
- `state: EdgeLabelState` - Label content and editing state
  - `label: string` - Current label text
  - `isEditing: boolean` - Whether in edit mode
  - `draftLabel: string` - Temporary label during editing
- `position: EdgeLabelPosition` - Label position
  - `x: number` - X coordinate
  - `y: number` - Y coordinate
- `handlers: EdgeLabelHandlers` - Event handlers
  - `onClick: (e: React.MouseEvent) => void` - Click handler
  - `onBlur: () => void` - Blur handler
  - `onChange: (value: string) => void` - Change handler
  - `onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void` - Keydown handler
- `visual: EdgeLabelVisual` - Visual state
  - `isSelected: boolean` - Selection state
  - `inputRef: React.RefObject<HTMLInputElement | null>` - Input reference

**Features:**
- Conditional rendering based on visibility logic
- Read mode: Displays label text or "Add Label" placeholder
- Edit mode: Input field with auto-focus and dynamic width
- Styling adapts based on selection and editing state

## Type Definitions

### EdgeLabelState

```typescript
export type EdgeLabelState = {
  label: string;
  isEditing: boolean;
  draftLabel: string;
};
```

### EdgeLabelPosition

```typescript
export type EdgeLabelPosition = {
  x: number;
  y: number;
};
```

### EdgeLabelHandlers

```typescript
export type EdgeLabelHandlers = {
  onClick: (e: React.MouseEvent) => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};
```

### EdgeLabelVisual

```typescript
export type EdgeLabelVisual = {
  isSelected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
};
```

## Testing

### Storybook

Presentational component can be tested independently:

```tsx
// edge-label-view.stories.tsx
export const Default = () => (
  <EdgeLabelView
    state={{
      label: "Connection Label",
      isEditing: false,
      draftLabel: "",
    }}
    position={{ x: 100, y: 50 }}
    handlers={{
      onClick: () => {},
      onBlur: () => {},
      onChange: () => {},
      onKeyDown: () => {},
    }}
    visual={{
      isSelected: true,
      inputRef: { current: null },
    }}
  />
);
```

### Unit Testing

Business logic can be tested with mock dependencies:

```tsx
const mockDomainDeps: DomainDependencies = {
  updateEdgeLabel: jest.fn().mockResolvedValue(true),
};

const business = useEdgeLabelBusiness(mockDomainDeps);
```

## Design Decisions

### Canvas Metadata Context

The component uses `useCanvasMetadata` context for pageId, orgId, workspaceId:
- **Production**: Gets values from Context (provided by CanvasMetadataProvider)
- **Testing**: Can override with `canvasMetadata` prop for testing without Context

### Semantic Grouping of Props

View component receives props grouped by semantic meaning:
- **state**: Label content and editing state
- **position**: Position information
- **handlers**: Event handlers
- **visual**: Visual state and refs

This improves readability and maintainability.

### Dynamic Input Width

Input width adjusts based on label length:
- Minimum width: 70px
- Calculated width: `label.length * 7px`
- Ensures input is always wide enough for content

### Visibility Logic

Label is shown when any of these conditions are met:
- Label text exists (user has added a label)
- Edge is selected (visual feedback)
- Label is being edited (user is actively editing)

This ensures the label is visible when it's relevant to the user.

## Related Components

- `CustomEdge`: Uses `EdgeLabel` to display and edit edge labels
- `useCanvasEdgeManagement`: Domain hook providing edge label update operations
- `useCanvasMetadata`: Context hook providing canvas metadata (pageId, orgId, workspaceId)
