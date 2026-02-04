# Tutorial Management Domain

Interactive tutorial system with dialog-based learning experiences.

## Overview

The tutorial system provides:
- **Dialog-based UI**: Tutorials open in a modal dialog from the sidebar
- **Interactive Components**: Mock components that mimic real functionality
- **Hard Restrictions**: Only current step's target is interactable
- **Progress Tracking**: LocalStorage-based progress persistence
- **Extensible Registry**: Easy to add new tutorials

## Architecture

```
tutorial-management/
├── frontend/
│   ├── components/
│   │   ├── tutorial-dialog/          # Main dialog system
│   │   │   ├── core/                 # Hooks & context
│   │   │   ├── components/           # Presentational components
│   │   │   └── index.tsx            # Container
│   │   └── common/                   # Shared components
│   │       ├── interaction-guard.tsx # Hard restriction wrapper
│   │       └── step-highlight.tsx    # Visual highlight effect
│   ├── hooks/                        # Domain-level hooks
│   │   ├── use-tutorial-progress.ts # Progress management
│   │   └── use-tutorial-registry.ts # Registry access
│   └── config/
│       ├── tutorial-registry.ts     # Tutorial registration
│       └── tutorials/               # Tutorial definitions
│           ├── getting-started.tutorial.tsx
│           ├── blocks/
│           │   └── content-blocks.tutorial.tsx
│           └── edges.tutorial.tsx
└── shared/
    └── types/
        └── tutorial.types.ts        # Type definitions
```

## Key Features

### 1. Dialog-Based Interface
- Opens from sidebar "Tutorials" button
- Left nav: Table of contents with progress indicators
- Right content: Interactive tutorial area
- Step indicator and navigation controls

### 2. Hard Restriction System
Use `InteractionGuard` to enforce step-by-step learning:

```tsx
<InteractionGuard selector="add-block-button">
  <Button>Add Block</Button>
</InteractionGuard>
```

Only the current step's target element is interactable; others are:
- Disabled (`pointer-events-none`)
- Visually dimmed (`opacity-40`)
- Grayscaled (`grayscale`)

### 3. Tutorial Definition

```typescript
export const myTutorial: Tutorial = {
  id: 'my-tutorial',
  name: 'My Tutorial',
  description: 'Learn something awesome',
  category: 'blocks',
  status: 'available',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'step-1',
      title: 'First Step',
      description: 'Click the button',
      targetSelector: 'my-button',
      action: 'click',
      onComplete: (state) => ({ ...state, buttonClicked: true }),
    },
  ],
  content: {
    initialState: { buttonClicked: false },
    ContentComponent: MyTutorialContent,
  },
};
```

### 4. Progress Tracking
- Automatically saved to LocalStorage
- Shows completed/in-progress/locked states
- Supports prerequisites

## Usage

### Opening the Tutorial Dialog

The dialog is integrated into the sidebar:
1. Click "Tutorials" button in sidebar footer
2. Browse available tutorials in left nav
3. Click a tutorial to start
4. Follow step-by-step instructions

### Adding a New Tutorial

1. Create tutorial definition in `config/tutorials/`
2. Define steps with `targetSelector` and actions
3. Create ContentComponent with mock interactions
4. Register in `tutorial-registry.ts`
5. Use `InteractionGuard` for step restrictions

## Container/Presentational Pattern

All components follow the frontend patterns:
- **Container** (`index.tsx`): Hooks + orchestration
- **Core** (`core/`): Business logic + UI state hooks
- **Components** (`components/`): Presentational only (Props)

## Next Steps

To extend the tutorial system:

1. **Add Mock Components**: Create mock versions of Canvas, Blocks, Editor Panel
   - Follow Container/Presentational pattern
   - Use `InteractionGuard` for restrictions
   - Connect to tutorial state via context

2. **Create More Tutorials**: 
   - Markdown Block
   - Shape Blocks
   - Deliver Blocks
   - Edge connections
   - AI features
   - Editor panel
   - Database features

3. **Enhance Interactions**:
   - Add validation logic to `validateComplete`
   - Create more sophisticated state transitions
   - Add animations and visual feedback

4. **Testing**:
   - Test with real users
   - Iterate on step descriptions
   - Optimize tutorial flow

## Integration Points

- **Sidebar**: [`dashboard-sidebar.tsx`](/Users/titanism/projects/ssota/apps/web/src/domains/organization-management/frontend/components/sidebar/dashboard-sidebar.tsx)
- **Tutorial Button**: Footer section with GraduationCap icon
- **Dialog Trigger**: Click opens `TutorialDialogStandalone`

## Technical Details

### State Management
- Dialog state: Internal to TutorialDialog component
- Tutorial state: Context-based, shared across mock components
- Progress: LocalStorage persistence

### Type Safety
- All types defined in `tutorial.types.ts`
- Strict TypeScript throughout
- Props interfaces for all components

### Extensibility
- Registry pattern for easy tutorial addition
- Category-based organization
- Prerequisites support for learning paths
