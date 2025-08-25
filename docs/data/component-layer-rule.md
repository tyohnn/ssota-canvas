# Component Layer Design Rules

## Overview

This document defines the rules and best practices for designing component layers in Next.js App Router architecture. Component layers represent the hierarchical structure of components within a single screen/page, showing the relationships between server and client components.

## Core Concepts

### Component Types

#### Server Components

- **Layout Components**: Provide structural layout and navigation
- **Page Components**: Main page content and data fetching
- **Logic Components**: Business logic and data processing

#### Client Components

- **Hook Components**: Custom hooks for state management and side effects
- **UI Components**: Reusable UI elements and user interactions

### Component Hierarchy

```
[Server Components]
├── Layout Component
│   ├── Page Component
│   │   ├── Logic Component
│   │   └── Client Components
│   │       ├── Hook Components
│   │       └── UI Components
│   └── Shared Components
└── [Client Components]
    ├── Hook Components
    └── UI Components
```

## Critical Rules

### 1. Server vs Client Component Separation

**Rule**: Clear separation between server and client components

- Server components handle data fetching, server-side logic, and initial rendering
- Client components handle interactivity, state management, and user interactions
- Use "use client" directive only when necessary

**Examples**:

```typescript
// Server Component - Data fetching
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  return <ProductDisplay product={product} />;
}

// Client Component - Interactivity
("use client");
function ProductDisplay({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  return <div>...</div>;
}
```

### 2. Component Hierarchy Rules

**Rule**: Follow Next.js App Router file structure

- Layout components in `layout.tsx` files
- Page components in `page.tsx` files
- Logic components in separate files within the same directory
- Client components clearly marked with "use client"

**Rule**: Avoid deep nesting

- Maximum 4 levels of component nesting
- Use composition over inheritance
- Extract reusable components to shared directories

### 3. Data Flow Patterns

**Rule**: Unidirectional data flow

- Data flows from server to client components
- State changes flow upward through callbacks
- Avoid prop drilling by using context or state management

**Rule**: Clear data boundaries

- Server components handle server-side data fetching
- Client components handle client-side state
- Use props for parent-to-child communication
- Use callbacks for child-to-parent communication

### 4. Component Naming Conventions

**Rule**: Descriptive and consistent naming

- Server components: `{Feature}Page`, `{Feature}Layout`, `{Feature}Logic`
- Client components: `{Feature}{Action}`, `use{Feature}{Action}`
- Groups: `{Domain} Components`, `{Feature} Components`

**Examples**:

```
Server: UserDashboardPage, ProductCatalogLayout, OrderProcessingLogic
Client: UserProfileForm, useUserData, ProductCard, OrderSummary
Groups: User Management Components, Product Catalog Components
```

## Organization Patterns

### 1. Feature-Based Organization

```
app/
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DashboardLogic.tsx
│   │   └── client/
│   │       ├── useDashboardData.ts
│   │       └── DashboardWidget.tsx
│   └── hooks/
│       └── useDashboardState.ts
domains/ (logic)
├── user-management/
│   ├── actions/
│   └── validations/
├── product-catalog/
│   ├── actions/
│   └── validations/
└── order-processing/
│   ├── actions/
│   └── validations/

```

## Component Relationships

### 1. Containment Relationships

**Rule**: Parent components contain child components

- Layout contains Page
- Page contains Logic and Client components
- Logic components contain Client components

**Edge Type**: `contains`

- Direct: Immediate parent-child relationship
- Conditional: Conditional rendering
- Dynamic: Dynamic component loading

### 2. Rendering Relationships

**Rule**: Components render other components

- Server components render Client components
- Layout components render Page components
- Page components render Logic components

**Edge Type**: `renders`

- Props: Data passed during rendering
- Condition: Conditional rendering logic

### 3. Management Relationships

**Rule**: Components manage state or data for other components

- Layout manages navigation state
- Page manages page-level state
- Logic components manage business logic state

**Edge Type**: `manages`

- State: Local component state
- Data: Shared data management
- Context: React context management
- Cache: Data caching management

### 4. Dependency Relationships

**Rule**: Components depend on other components

- Client components depend on Server components for data
- UI components depend on Hook components for state
- Logic components depend on data fetching

**Edge Type**: `depends-on`

- Data: Data dependencies
- Functionality: Functional dependencies
- Rendering: Rendering dependencies
- Validation: Validation dependencies

### 5. Communication Relationships

**Rule**: Components communicate with each other

- Event-based communication
- Callback-based communication
- Message-based communication

**Edge Type**: `communicates-with`

- Event: Event-driven communication
- Callback: Callback-based communication
- Message: Message-based communication
- Signal: Signal-based communication

## Validation Rules

### 1. Component Structure Validation

- All components must have a defined type (server/client)
- All components must have a responsible team member
- All components must have a file path defined
- Component names must follow naming conventions

### 2. Relationship Validation

- No circular dependencies between components
- Server components cannot depend on Client components
- All relationships must have defined types and metadata
- Component hierarchy must follow Next.js App Router patterns

### 3. Data Flow Validation

- Data flow must be unidirectional
- Server-to-client data flow must be clearly defined
- Client-to-server communication must use proper patterns
- State management must be clearly defined

### 4. Performance Validation

- Component nesting should not exceed 4 levels
- Large components should be split into smaller ones
- Reusable components should be extracted
- Lazy loading should be used for large component trees

## Common Pitfalls

### 1. Over-Engineering

- Avoid creating too many small components
- Don't split components unnecessarily
- Keep component hierarchy simple and logical

### 2. Poor Separation of Concerns

- Don't mix server and client logic
- Don't put business logic in UI components
- Don't put UI logic in server components

### 3. Inconsistent Naming

- Don't use inconsistent naming conventions
- Don't mix different naming patterns
- Don't use unclear or ambiguous names

### 4. Circular Dependencies

- Don't create circular dependencies between components
- Don't create bidirectional data flow
- Don't create complex dependency chains

## Best Practices

### 1. Component Design

- Keep components focused and single-purpose
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Use TypeScript for better type safety

### 2. Performance Optimization

- Use React.memo for expensive components
- Implement proper loading states
- Use lazy loading for large component trees
- Optimize re-renders with proper dependencies

### 3. Testing Strategy

- Test server components for data fetching
- Test client components for interactivity
- Test component relationships and data flow
- Use integration tests for component interactions

### 4. Documentation

- Document component purposes and responsibilities
- Document component relationships and dependencies
- Document data flow patterns
- Keep component layer diagrams updated

## Integration with Other Artifacts

### 1. Database Schema Integration

- Server components should align with database entities
- Data fetching should match database queries
- Component state should reflect database state

### 2. User Flow Integration

- Component structure should support user flow requirements
- Component interactions should match user interactions
- Component state should reflect user journey states

### 3. Test Case Integration

- Component structure should support test scenarios
- Component interactions should be testable
- Component state should be predictable for testing

### 4. Page Structure Integration

- Component hierarchy should align with page structure
- Component file paths should match Next.js App Router structure
- Component relationships should reflect page relationships
