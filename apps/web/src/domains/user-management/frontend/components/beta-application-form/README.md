# Beta Application Form Component

Beta access application form component following Compound Component Pattern.

## Architecture

This component follows DDD (Domain-Driven Design) and Component Development Guidelines:
- **Compound Component Pattern**: Provider + Sub-components
- **Logic Separation**: UI State (.ui.ts) + Business Logic (.business.ts)
- **No-code Compatible**: Can be used in Framer, Webflow, etc.

## Folder Structure

```
beta-application-form/
├── core/                                    # Core logic
│   ├── types.ts                             # Type definitions
│   ├── context.tsx                          # Context definition
│   ├── provider.tsx                         # Context Provider
│   ├── use-beta-application-form.ui.ts      # UI state hook (Designer)
│   ├── use-beta-application-form.business.ts # Business logic hook (Engineer)
│   └── use-beta-application-form.ts         # Combined hook
├── components/                              # Sub-components
│   ├── form-header.tsx                      # Header with title/description
│   ├── purpose-input.tsx                    # Purpose input field
│   ├── organization-input.tsx               # Organization input field
│   ├── use-case-input.tsx                   # Use case input field
│   ├── referral-input.tsx                   # Referral code input field
│   ├── error-alert.tsx                      # Error message alert
│   ├── submit-button.tsx                    # Submit button
│   └── form-footer.tsx                      # Footer with button/notice
└── index.tsx                                # Main entry (Provider + composition)
```

## Usage

### Basic Usage

```tsx
import { BetaApplicationForm } from '@/domains/user-management/frontend/components/beta-application-form';

export default function Page() {
  return (
    <div className="container">
      <BetaApplicationForm />
    </div>
  );
}
```

### With Callbacks

```tsx
<BetaApplicationForm
  onSuccess={() => console.log('Application submitted!')}
  onError={(error) => console.error('Error:', error)}
/>
```

### With Mock Business Logic (Testing/No-code)

```tsx
import {
  BetaApplicationForm,
  useMockBetaApplicationBusiness,
} from '@/domains/user-management/frontend/components/beta-application-form';

function DesignerPreview() {
  const mockBusiness = useMockBetaApplicationBusiness();
  
  return <BetaApplicationForm businessLogic={mockBusiness} />;
}
```

### Custom Composition (Advanced)

```tsx
import {
  BetaApplicationFormProvider,
  FormHeader,
  PurposeInput,
  OrganizationInput,
  SubmitButton,
} from '@/domains/user-management/frontend/components/beta-application-form';

function CustomForm() {
  return (
    <BetaApplicationFormProvider>
      <div className="custom-layout">
        <FormHeader title="Join Our Beta" />
        <PurposeInput placeholder="Tell us your purpose..." />
        <OrganizationInput />
        <SubmitButton text="Apply Now" />
      </div>
    </BetaApplicationFormProvider>
  );
}
```

## Sub-components

All sub-components automatically connect to Context and require no props for data:

- **FormHeader**: Title and description
- **NameInput**: Name field (optional)
- **OrganizationInput**: Organization field (optional)
- **PurposeSelect**: Purpose selection field (optional)
- **UseCaseSelect**: Use case selection field (optional)
- **SubmitButton**: Submit button with loading state
- **FormFooter**: Footer with button and privacy notice

## Hooks

### For Designers (No-code tools)

```tsx
import { useBetaApplicationFormUI } from './core/use-beta-application-form.ui';

// UI state only - no API calls
const {
  formData,
  isSubmitting,
  error,
  updateField,
  isValid,
} = useBetaApplicationFormUI();
```

### For Engineers (Production)

```tsx
import { useBetaApplicationBusiness } from './core/use-beta-application-form.business';

// Business logic - API calls, validation
const {
  onSubmit,
  validate,
} = useBetaApplicationBusiness();
```

### Combined Hook

```tsx
import { useBetaApplicationForm } from './core/use-beta-application-form';

// Full functionality
const {
  formData,
  isSubmitting,
  error,
  isValid,
  handleSubmit,
  handleFieldChange,
} = useBetaApplicationForm();
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

- [BetaPendingStatus](../beta-pending-status/README.md) - Application review status

