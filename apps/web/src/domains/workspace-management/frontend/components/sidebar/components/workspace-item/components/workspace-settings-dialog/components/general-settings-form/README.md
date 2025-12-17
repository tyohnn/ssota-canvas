# GeneralSettingsForm Component

Form for editing workspace information following **Container/Presentational pattern** (v4.0.0).

## Architecture

### Container/Presentational Pattern

```
┌─────────────────────────────────┐
│  GeneralSettingsForm (Container)│
│  - Hook: useGeneralSettingsForm()│
│  - Props → Presentational       │
└──────────┬──────────────────────┘
           │ Props
           ↓
┌─────────────────────────────────┐
│  Presentational Components      │
│  - FormHeader                   │
│  - WorkspaceNameField           │
│  - WorkspaceDescriptionField    │
│  - FormActions                  │
└─────────────────────────────────┘
```

## Folder Structure

```
general-settings-form/
├── components/              # Presentational (Props only)
│   ├── general-settings-form-content.tsx
│   ├── form-header.tsx
│   ├── workspace-name-field.tsx
│   ├── workspace-description-field.tsx
│   └── form-actions.tsx
├── core/                    # Business Logic
│   ├── types.ts
│   ├── use-general-settings-form.ts
│   ├── use-general-settings-form.ui.ts
│   └── use-general-settings-form.business.ts
└── index.tsx                # Container (Hook → Props)
```

## Usage

### Production

```tsx
import { GeneralSettingsForm } from './components/general-settings-form';

<GeneralSettingsForm workspace={workspace} onClose={handleClose} />
```

### Storybook (Presentational Components)

```tsx
// workspace-name-field.stories.tsx
export const Default = () => (
  <WorkspaceNameField
    form={mockForm}
    isSubmitting={false}
    isDefault={false}
  />
);

export const DefaultWorkspace = () => (
  <WorkspaceNameField
    form={mockForm}
    isSubmitting={false}
    isDefault={true}  // Shows "cannot be deleted" message
  />
);
```

### Testing with Mock

```tsx
import { 
  GeneralSettingsForm, 
  useMockGeneralSettingsFormBusiness 
} from './components/general-settings-form';

const mockBusiness = useMockGeneralSettingsFormBusiness();
<GeneralSettingsForm
  workspace={mockWorkspace}
  onClose={() => {}}
  businessLogic={mockBusiness}
/>
```

## Components

### Container

- **`GeneralSettingsForm` (index.tsx)**: Hook → Props transformation

### Presentational (Storybook Testable)

- **`GeneralSettingsFormContent`**: Form layout wrapper
- **`FormHeader`**: Title and description
- **`WorkspaceNameField`**: Icon picker + name input
- **`WorkspaceDescriptionField`**: Description textarea with character counter
- **`FormActions`**: Cancel and Save buttons

### Hooks

- **`useGeneralSettingsForm`**: Combined Hook (Container use)
- **`useGeneralSettingsFormUI`**: UI state (form, loading)
- **`useGeneralSettingsFormBusiness`**: Production logic (TanStack Query)
- **`useMockGeneralSettingsFormBusiness`**: Mock for Storybook

## TanStack Query Integration

### Optimistic Update

```tsx
const mutation = useMutation({
  mutationFn: async (params) => {
    const result = await updateWorkspaceInfoAction(params);
    if (!result.success) throw new Error('Failed');
    return result;
  },
  
  // Optimistic update: Update workspace list immediately
  onMutate: async (params) => {
    const previousWorkspaces = workspaces;
    
    setWorkspaces(prev =>
      prev.map(ws =>
        ws.workspaceId === params.workspaceId
          ? { ...ws, name: params.name, ... }
          : ws
      )
    );
    
    return { previousWorkspaces };
  },
  
  // Auto rollback on error
  onError: (error, params, context) => {
    setWorkspaces(context.previousWorkspaces);
    toast.error('Modification failed');
  },
  
  onSuccess: () => {
    toast.success('Workspace information updated');
  },
});
```

## Props Design (Storybook Compatible)

### Presentational Component Props

```tsx
// ✅ Simple values only
interface WorkspaceNameFieldProps {
  form: UseFormReturn;      // Form control
  isSubmitting: boolean;    // Boolean
  isDefault: boolean;       // Boolean
}

// ✅ Simple callbacks
interface FormActionsProps {
  onCancel: () => void;     // Simple callback
  isDirty: boolean;
  isSubmitting: boolean;
}
```

## References

- [Component Development Guidelines v4.0.0](/docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- Container/Presentational Pattern
- TanStack Query Optimistic Updates
