# Edge Toolbar Components

Presentational components for the Edge Toolbar. These components receive props only and have no Hook or Context dependencies, making them ideal for Storybook testing.

## Components

### EdgeToolbarView

Main presentational component that combines all toolbar items.

**Location**: `components/edge-toolbar-view.tsx`

**Props:**
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

**Features:**
- Combines `ShapeSelector`, `WidthSelector`, `ColorSelector`, and Delete button
- Conditional rendering based on zoom level
- Prevents event propagation for wheel, mouse, and click events
- Uses `touchAction: 'none'` to prevent pinch zoom on mobile

### ShapeSelector

Presentational component for edge shape selection.

**Location**: `components/shape-selector.tsx`

**Props:**
- `currentShape: EdgeShape` - Current edge shape ('default', 'straight', 'smoothstep')
- `onShapeChange: (shape: EdgeShape) => void` - Handler for shape change
- `zoom: number` - Current zoom level (for semantic zooming)

**Features:**
- Icon-only display (Workflow, Minus, TrendingUp icons)
- Uses `ToolbarOptionPopover` for selection UI
- Tooltip: "Edge Type"
- Popover opens above the trigger
- Uncontrolled Popover (managed by Radix UI)

**Shape Options:**
- `default`: Curve (Workflow icon)
- `straight`: Straight line (Minus icon)
- `smoothstep`: Step (TrendingUp icon)

### WidthSelector

Presentational component for edge width selection.

**Location**: `components/width-selector.tsx`

**Props:**
- `currentWidth: number` - Current edge width (normalized to 1, 2, or 3)
- `onWidthChange: (width: EdgeWidth) => void` - Handler for width change
- `zoom: number` - Current zoom level (for semantic zooming)

**Features:**
- Width normalization: Maps any number to nearest EdgeWidth (1, 2, or 3)
- Custom equality check for approximate matching (tolerance: 0.5)
- Icon shows visual width representation (Minus icon with varying strokeWidth)
- Uses `ToolbarOptionPopover` for selection UI
- Tooltip: "Edge Width"
- Popover opens above the trigger
- Uncontrolled Popover (managed by Radix UI)

**Width Options:**
- `1`: Thin (strokeWidth={1})
- `2`: Medium (strokeWidth={2})
- `3`: Thick (strokeWidth={3})

### ColorSelector

Presentational component for edge color selection.

**Location**: `components/color-selector.tsx`

**Props:**
- `currentColor: ColorToken` - Current color token
- `onColorChange: (colorToken: ColorToken) => void` - Handler for color change
- `zoom: number` - Current zoom level (for semantic zooming)

**Features:**
- Color preview swatches with border styling
- GRAY color appears first in the list (neutral default)
- Uses `ToolbarOptionPopover` for selection UI
- Tooltip: "Edge Color"
- Popover opens above the trigger
- Custom trigger icon styling (`border-1`)
- Uncontrolled Popover (managed by Radix UI)

**Color Options:**
- GRAY (appears first)
- RED, ORANGE, AMBER, GREEN, BLUE, PURPLE, PINK

## Testing

All components are presentational and can be tested independently in Storybook:

```tsx
// shape-selector.stories.tsx
export const Default = () => (
  <ShapeSelector
    currentShape="default"
    onShapeChange={(shape) => console.log('Shape changed:', shape)}
    zoom={1.0}
  />
);

export const Straight = () => (
  <ShapeSelector
    currentShape="straight"
    onShapeChange={(shape) => console.log('Shape changed:', shape)}
    zoom={1.0}
  />
);
```

## Design Patterns

### Uncontrolled Popovers

All selector components use Radix UI's uncontrolled Popover mode:
- Popover state is managed internally by Radix UI
- No manual `open` state management required
- Popovers automatically close after selection
- Simplifies component code

### Semantic Zooming

All components receive `zoom` prop for semantic zooming:
- Components can adjust their appearance based on zoom level
- Currently used for visibility calculations in parent component
- Future: Can be used for icon size adjustments, tooltip visibility, etc.

### Consistent Icon Design

All selector components use consistent icon patterns:
- Same icon size and styling
- Visual representation matches the option value
- Tooltips provide clear labels
