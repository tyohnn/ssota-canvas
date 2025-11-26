# Beta Pending Status Component

Beta application review status component following Compound Component Pattern.

## Architecture

This component follows DDD (Domain-Driven Design) and Component Development Guidelines:
- **Compound Component Pattern**: Provider + Sub-components
- **Logic Separation**: UI State (.ui.ts) + Business Logic (.business.ts)
- **No-code Compatible**: Can be used in Framer, Webflow, etc.

## Folder Structure

```
beta-pending-status/
├── core/                                    # Core logic
│   ├── types.ts                             # Type definitions
│   ├── context.tsx                          # Context definition
│   ├── provider.tsx                         # Context Provider
│   ├── use-beta-pending-status.ui.ts        # UI state hook (Designer)
│   ├── use-beta-pending-status.business.ts  # Business logic hook (Engineer)
│   └── use-beta-pending-status.ts           # Combined hook
├── components/                              # Sub-components
│   ├── status-header.tsx                    # Header with icon/title
│   ├── success-alert.tsx                    # Success message alert
│   ├── timeline.tsx                         # Review timeline
│   ├── info-box.tsx                         # Information box
│   ├── additional-info.tsx                  # Additional instructions
│   ├── sign-out-button.tsx                  # Sign-out button
│   └── status-footer.tsx                    # Footer with button/contact
└── index.tsx                                # Main entry (Provider + composition)
```

## Usage

### Basic Usage

```tsx
import { BetaPendingStatus } from '@/domains/user-management/frontend/components/beta-pending-status';

export default function Page() {
  return (
    <div className="container">
      <BetaPendingStatus />
    </div>
  );
}
```

### With Callback

```tsx
<BetaPendingStatus
  onSignOut={() => console.log('User signed out')}
/>
```

### With Mock Business Logic (Testing/No-code)

```tsx
import {
  BetaPendingStatus,
  useMockBetaPendingStatusBusiness,
} from '@/domains/user-management/frontend/components/beta-pending-status';

function DesignerPreview() {
  const mockBusiness = useMockBetaPendingStatusBusiness();
  
  return <BetaPendingStatus businessLogic={mockBusiness} />;
}
```

### Custom Composition (Advanced)

```tsx
import {
  BetaPendingStatusProvider,
  StatusHeader,
  Timeline,
  SignOutButton,
} from '@/domains/user-management/frontend/components/beta-pending-status';

function CustomStatus() {
  return (
    <BetaPendingStatusProvider>
      <div className="custom-layout">
        <StatusHeader title="Application Pending" />
        <Timeline />
        <SignOutButton text="Exit" />
      </div>
    </BetaPendingStatusProvider>
  );
}
```

## Sub-components

All sub-components automatically connect to Context and require no props for data:

- **StatusHeader**: Icon, title, and description
- **SuccessAlert**: Success message alert
- **Timeline**: 3-step review timeline
- **InfoBox**: Information box with icon
- **AdditionalInfo**: Additional instructions
- **SignOutButton**: Sign-out button with loading state
- **StatusFooter**: Footer with button and contact info

## Hooks

### For Designers (No-code tools)

```tsx
import { useBetaPendingStatusUI } from './core/use-beta-pending-status.ui';

// UI state only - no API calls
const {
  isSigningOut,
  setIsSigningOut,
} = useBetaPendingStatusUI();
```

### For Engineers (Production)

```tsx
import { useBetaPendingStatusBusiness } from './core/use-beta-pending-status.business';

// Business logic - sign-out action
const {
  onSignOut,
} = useBetaPendingStatusBusiness();
```

### Combined Hook

```tsx
import { useBetaPendingStatus } from './core/use-beta-pending-status';

// Full functionality
const {
  isSigningOut,
  handleSignOut,
} = useBetaPendingStatus();
```

## Features

- ✅ **Compound Component Pattern**: Flexible composition
- ✅ **Logic Separation**: UI/Business decoupled
- ✅ **Context-based**: No props drilling
- ✅ **No-code Compatible**: Works with Framer, Webflow
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Mock Support**: Easy testing and prototyping
- ✅ **Customizable**: All text and styles can be overridden

## Design Guidelines

This component follows:
- [Component Development Guidelines](../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [Server-Side DDD Conventions](../../../../../../docs/event-domain-design/discussion/architecture-conventions/server-side-ddd-conventions.md)

## Related Components

- [BetaApplicationForm](../beta-application-form/README.md) - Application form

