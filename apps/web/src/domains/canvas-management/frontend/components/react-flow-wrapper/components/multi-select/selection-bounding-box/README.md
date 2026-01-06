# Selection Bounding Box

A visual bounding box component that wraps multiple selected blocks on the canvas, allowing users to drag all selected blocks together.

## Structure

The component follows a fractal architecture pattern and adheres to the **Component Development Guidelines** using the Container/Presentational pattern:

```
selection-bounding-box/
├── components/          # UI components (Presentational)
│   └── bounding-box-view.tsx    # Pure UI rendering component
├── core/                # Business logic
│   ├── types.ts                         # Type definitions
│   ├── use-selection-bounding-box.ui.ts      # UI state hook (for designers)
│   ├── use-selection-bounding-box.business.ts # Business logic hook (for engineers)
│   └── use-selection-bounding-box.ts          # Integration hook
└── index.tsx            # Container component (uses hook directly)
```

## Architecture Pattern

### Container/Presentational Pattern

1. **Container** (`index.tsx`): Uses hook directly to get values and passes them as props
2. **Presentational** (`components/`): **Receives only props for rendering** (no Hook/Context dependencies)
3. **Core** (`core/`): Separates UI state and business logic

### No Context Pattern

- **No Context**: Provider/Context pattern removed, hooks used directly
- **Presentational components receive only props**: Can be tested independently in Storybook
- **Container converts Hook → Props**: Gets values from hook and passes as props

### Logic Separation

- **UI Logic** (`.ui.ts`): Bounding box position calculation, DOM measurements, coordinate conversions, drag interaction state management (refs, drag start/move/end calculations)
  - Interface: `SelectionBoundingBoxUILogic`
  - Production: `useSelectionBoundingBoxUILogic()` (always used, no mocking needed)
- **Business Logic** (`.business.ts`): Node position updates, server persistence
  - Interface: `SelectionBoundingBoxBusinessLogic`
  - Production: `useSelectionBoundingBoxBusiness()`
  - Mock: `useMockSelectionBoundingBoxBusiness()` (for testing/Storybook)
- **Integration Hook** (`.ts`): Orchestrates UI and Business logic, manages event listeners, delegates calculations to UI layer

## Role

- **Visual feedback**: Displays a blue bounding box around selected blocks
- **Multi-block dragging**: Allows dragging all selected blocks together
- **Position persistence**: Saves block positions to server after drag ends

## Rendering Conditions

The bounding box is rendered only when all of the following conditions are met:

1. `isMultiSelectionMode() === true`
2. `getSelectionCount() >= 2`
3. `bounds !== null` (boundary calculation successful)

## Usage Examples

### Production (Default)

```tsx
<SelectionBoundingBox
  orgId={orgId}
  workspaceId={workspaceId}
/>
// businessLogic omitted → uses default business logic
```

### Test/Mock

```tsx
import { useMockSelectionBoundingBoxBusiness } from './core/use-selection-bounding-box.business';

const mockBusiness = useMockSelectionBoundingBoxBusiness();

<SelectionBoundingBox
  orgId={orgId}
  workspaceId={workspaceId}
  businessLogic={mockBusiness} // 🧪 Inject mock business logic
/>
```

### Storybook (Designer)

```tsx
import { BoundingBoxView } from './components/bounding-box-view';

// Testable with props only! No Context needed!
export const Default = () => (
  <BoundingBoxView
    bounds={{
      left: 100,
      top: 200,
      width: 300,
      height: 150,
    }}
    boundingBoxRef={{ current: null }}
    onMouseDown={(e) => console.log('Mouse down:', e)}
  />
);
```

## Features

- ✅ **Container/Presentational separation**: Improved testability
- ✅ **No Context**: Provider/Context pattern removed, hooks used directly
- ✅ **Storybook-friendly**: Testable with props only (no Context/Hook dependencies)
- ✅ **Logic separation**: UI/Business logic can be tested independently
- ✅ **Mock support**: Business logic can be injected
- ✅ **Performance optimization**: `willChange`, `touchAction` optimizations applied
- ✅ **Accessibility**: Prevents pinch zoom, handles pointer events properly

## Component Description

### BoundingBoxView

A pure presentational component that renders the visual bounding box. It receives:
- `bounds`: Bounding box position and size in screen coordinates
- `boundingBoxRef`: Reference to the DOM element
- `onMouseDown`: Handler for starting drag operation

All business logic and state management is handled by the parent Container component.

## Hook Usage

**Hooks are used directly. No Context/Provider pattern is used.**

The Container (`SelectionBoundingBox`) uses the `useSelectionBoundingBox` hook to get values and passes them as props to the Presentational component.

### Hook Return Values

- `bounds`: Bounding box bounds in screen coordinates
- `boundingBoxRef`: Reference to the bounding box DOM element
- `handleMouseDown`: Handler to start dragging
- `isVisible`: Whether the bounding box should be visible

### Presentational Component Props

- `BoundingBoxView`: `bounds` (object), `boundingBoxRef` (ref), `onMouseDown` (function)

## Implementation Details

### Coordinate System Conversion

The component handles two coordinate systems:
- **Flow coordinates**: Internal React Flow coordinate system
- **Screen coordinates**: Browser viewport coordinates

The bounding box position is calculated in Flow coordinates and converted to Screen coordinates for rendering, taking into account viewport zoom and pan.

### Drag Handling

The drag interaction is managed entirely in the UI layer:

1. **Mouse down** (`startDragging`): Stores initial positions and drag start point in UI state
2. **Mouse move** (`moveDragging`): Calculates delta in screen coordinates, converts to Flow coordinates, and returns updated positions (pure calculation, no side effects)
3. **Mouse up** (`endDragging`): Resets drag state and calculates which positions have changed

The integration hook (`use-selection-bounding-box.ts`) orchestrates these UI functions:
- Calls `startDragging` to initialize drag state
- Calls `moveDragging` to get updated positions, then passes to business logic to update React Flow
- Calls `endDragging` to get changed positions, then passes to business logic to save to server
- Manages document-level event listeners (pointermove, pointerup)

### Position Persistence

After dragging ends, only nodes whose positions have changed are saved to the server. This is handled by the `calculateChangedPositions` function in the UI hook, which compares initial and current positions.
