# Next.js App Router Route Group and Layout Rules

## Overview

This document defines the essential rules and best practices for using Route Groups in Next.js App Router to prevent layout conflicts and maintain clear file system hierarchy.

## Core Concepts

### Route Groups

Route Groups allow you to organize routes into logical groups without affecting the URL structure. They are created by wrapping folder names in parentheses: `(groupName)`.

### Layout Hierarchy

Layouts in Next.js App Router follow a strict nesting hierarchy:

- Root Layout (`app/layout.tsx`) - Applied to all pages
- Group Layouts (`app/(group)/layout.tsx`) - Applied to group pages
- Page Components (`app/(group)/page/page.tsx`) - Individual page content

## Critical Rules

### 1. No Nested Layouts Within Route Groups

**❌ INCORRECT - Layout Conflict**

```
app/
├── (dashboard)/
│   ├── layout.tsx          # Dashboard group layout
│   └── dashboard/
│       ├── layout.tsx      # ❌ Nested layout - CONFLICT!
│       └── page.tsx
```

**✅ CORRECT - Clear Hierarchy**

```
app/
├── (dashboard)/
│   ├── layout.tsx          # Dashboard group layout
│   └── dashboard/
│       └── page.tsx        # ✅ No nested layout
```

### 2. Layout Nesting Order

Layouts are applied in the following order:

1. Root Layout (`app/layout.tsx`)
2. Group Layout (`app/(group)/layout.tsx`)
3. Page Component (`app/(group)/page/page.tsx`)

**Example Structure:**

```typescript
// app/layout.tsx (Root Layout)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <div className="app-container">
          {children} {/* Group layout renders here */}
        </div>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx (Group Layout)
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main>{children}</main> {/* Page component renders here */}
    </div>
  );
}
```

### 3. Clear Responsibility Separation

**Root Layout Responsibilities:**

- HTML and body tags
- Global styles and fonts
- Global providers (Theme, Auth, etc.)
- Global error boundaries
- Global loading states

**Group Layout Responsibilities:**

- Group-specific navigation
- Group-specific sidebar/header
- Group-specific layout structure
- Group-specific providers
- Group-specific error handling

**Page Component Responsibilities:**

- Page-specific content
- Page-specific data fetching
- Page-specific interactions
- Page-specific metadata

### 4. Route Group Organization Patterns

#### Pattern 1: Feature-based Groups

```
app/
├── (auth)/
│   ├── layout.tsx
│   ├── sign-in/
│   │   └── page.tsx
│   └── sign-up/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
└── (marketing)/
    ├── layout.tsx
    ├── about/
    │   └── page.tsx
    └── pricing/
        └── page.tsx
```

### 5. Component Organization

**Shared Components Structure:**

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
```

### 6. Validation Rules

#### Layout Conflict Detection

- Check for nested layouts within route groups
- Verify layout hierarchy is not circular
- Ensure each route group has at most one layout file

#### Responsibility Validation

- Root layout must contain HTML and body tags
- Group layouts should not duplicate root layout responsibilities
- Page components should focus on content, not layout structure

#### File Structure Validation

- Route group folders must be wrapped in parentheses
- Layout files must be named `layout.tsx`
- Page files must be named `page.tsx`
- No layout files inside page folders

### 7. Common Pitfalls and Solutions

#### Pitfall 1: Duplicate Navigation

**Problem:** Navigation appears in both root and group layouts
**Solution:** Keep global navigation in root layout, group-specific navigation in group layout

#### Pitfall 2: Layout Inheritance Issues

**Problem:** Group layout not inheriting from root layout properly
**Solution:** Ensure root layout renders `{children}` and group layout is properly nested

#### Pitfall 3: Styling Conflicts

**Problem:** CSS conflicts between different layouts
**Solution:** Use CSS modules or scoped styling for group-specific styles

#### Pitfall 4: Provider Conflicts

**Problem:** Multiple providers with conflicting state
**Solution:** Organize providers by scope (global vs group-specific)

### 8. Best Practices

1. **Keep Layouts Simple:** Each layout should have a single, clear responsibility
2. **Use Descriptive Group Names:** Group names should clearly indicate their purpose
3. **Minimize Layout Depth:** Avoid deeply nested layouts when possible
4. **Document Layout Dependencies:** Clearly document which components each layout depends on
5. **Test Layout Combinations:** Verify that all layout combinations work correctly
6. **Consider Performance:** Be mindful of layout re-renders and component mounting

### 9. Migration Guidelines

When updating existing page structures:

1. **Analyze Current Layouts:** Identify existing layout patterns and conflicts
2. **Plan Migration Strategy:** Determine which layouts can be consolidated or separated
3. **Maintain Backward Compatibility:** Ensure existing functionality is preserved
4. **Test Incrementally:** Update layouts one group at a time
5. **Document Changes:** Record all layout changes and their rationale

### 10. Implementation Checklist

- [ ] Route groups are properly named with parentheses
- [ ] No nested layouts within route groups
- [ ] Layout hierarchy is clear and logical
- [ ] Responsibilities are properly separated
- [ ] Components are organized by scope
- [ ] No layout conflicts or circular dependencies
- [ ] All layouts render `{children}` properly
- [ ] CSS and styling are properly scoped
- [ ] Providers are organized by scope
- [ ] Layout performance is optimized

## Conclusion

Following these rules ensures that Next.js App Router route groups and layouts work together harmoniously without conflicts. The key principles are:

1. **Clear Hierarchy:** Maintain a clear and logical layout hierarchy
2. **Single Responsibility:** Each layout should have a single, well-defined purpose
3. **No Conflicts:** Avoid nested layouts and conflicting responsibilities
4. **Proper Organization:** Organize components and layouts by scope and purpose

By adhering to these guidelines, you can create maintainable and scalable Next.js applications with clear separation of concerns and predictable layout behavior.
