# MembersTab Component

Tab for managing workspace members following **Container/Presentational pattern** (v4.0.0).

## Architecture

### Container/Presentational Pattern

```
┌─────────────────────────────────┐
│  MembersTab (Container)         │
│  - Hook: useMembersTab()        │
│  - Props → Presentational       │
└──────────┬──────────────────────┘
           │ Props
           ↓
┌─────────────────────────────────┐
│  Presentational Components      │
│  - MembersTabContent            │
│  - MembersTabHeader             │
│  - WorkspaceMemberListTable     │
│  - InviteDialogWrapper          │
└─────────────────────────────────┘
```

### Key Changes from v3.x

**Before (v3.x):** Local Context/Provider
```tsx
<MembersTabProvider>  // ❌ Local Context
  <MembersTabContent />
</MembersTabProvider>
```

**After (v4.0.0):** Container → Props
```tsx
// Container
const { memberView, isLoading } = useMembersTab(props);

// Props → Presentational
<MembersTabContent 
  memberView={memberView}
  isLoading={isLoading}
/>
```

## Folder Structure

```
members-tab/
├── components/              # Presentational (Props only)
│   ├── invite-dialog-wrapper.tsx
│   ├── members-tab-content.tsx
│   ├── members-tab-header.tsx
│   └── workspace-member-list-table.tsx
├── core/                    # Business Logic
│   ├── types.ts
│   ├── use-members-tab.ts   # Combined Hook
│   ├── use-members-tab.ui.ts
│   └── use-members-tab.business.ts
└── index.tsx                # Container (Hook → Props)
```

**Removed (v4.0.0):**
- ~~`core/context.tsx`~~ (Local Context not needed)
- ~~`core/provider.tsx`~~ (Props drilling 1-2 levels is fine)

## Usage

### Production

```tsx
import { MembersTab } from './components/members-tab';

<MembersTab workspaceId={workspaceId} />
```

### Storybook (Presentational Components)

```tsx
// workspace-member-list-table.stories.tsx
export const Default = () => (
  <WorkspaceMemberListTable
    currentMembers={mockMembers}
    pendingInvitations={[]}
    isLoading={false}
  />
);

export const Loading = () => (
  <WorkspaceMemberListTable
    currentMembers={[]}
    pendingInvitations={[]}
    isLoading={true}
  />
);
```

### Testing with Mock

```tsx
import { MembersTab, useMockMembersTabBusiness } from './components/members-tab';

const mockBusiness = useMockMembersTabBusiness();
<MembersTab 
  workspaceId="test-id"
  businessLogic={mockBusiness}
/>
```

## Components

### Container

- **`MembersTab` (index.tsx)**: Hook → Props transformation

### Presentational (Storybook Testable)

- **`MembersTabContent`**: Layout wrapper
- **`MembersTabHeader`**: Title, description, invite button
- **`WorkspaceMemberListTable`**: Member/invitation list
- **`InviteDialogWrapper`**: Invite dialog integration

### Hooks

- **`useMembersTab`**: Combined Hook (Container use)
- **`useMembersTabUI`**: UI state
- **`useMembersTabBusiness`**: Production business logic (TanStack Query)
- **`useMockMembersTabBusiness`**: Mock for Storybook

## TanStack Query Integration

### Benefits

```tsx
// ✅ Auto loading state
const { isLoadingMembersQuery } = useMembersTabBusiness();

// ✅ Error handling
onError: (error) => {
  toast.error('Failed to load members');
}

// ✅ Retry logic (optional)
// ✅ Request deduplication
```

### Usage

```tsx
const mutation = useMutation({
  mutationFn: async (workspaceId: string) => {
    const result = await getWorkspaceMembersAction({ workspaceId });
    if (!result.success) throw new Error('Failed');
    return result;
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

return {
  loadMemberView: mutation.mutateAsync,
  isLoadingMembersQuery: mutation.isPending, // Auto loading state
};
```

## Context Usage

### Domain-level Context ✅

```tsx
// From workspace-settings-dialog (parent)
const { setIsInviteDialogOpen } = useWorkspaceSettingsDialogContext();
```

Used in:
- `MembersTabHeader` (invite button)
- `InviteDialogWrapper` (dialog state)

### Local Context ❌

**Removed in v4.0.0** - Props passing is simpler for local state.

## Props Design (No-code Compatible)

### Presentational Component Props

```tsx
// ✅ Simple values only
interface WorkspaceMemberListTableProps {
  currentMembers: Member[];      // Array
  pendingInvitations: [];        // Array
  isLoading: boolean;            // Boolean
}

// ❌ NO function props
// ❌ NO complex objects
// ❌ NO Context dependency
```

## Guidelines

### When to use Context vs Props

- **Domain-level** (workspace-settings-dialog): Context ✅
- **Local-level** (members-tab): Props ✅ (1-2 levels drilling)

### Component Development Checklist

- [ ] Container uses Hook
- [ ] Props passed to Presentational
- [ ] No local Context
- [ ] Presentational components have no Hook/Context
- [ ] Storybook stories created
- [ ] Mock business logic provided

## References

- [Component Development Guidelines v4.0.0](/docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- Container/Presentational Pattern
- Storybook-first Development

