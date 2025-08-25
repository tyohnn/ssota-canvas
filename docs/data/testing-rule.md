---
description: Testing rules and guidelines for Xbowl development using Vitest
globs:
alwaysApply: false
---

## Testing Framework and Tools

### Primary Testing Framework

- **Vitest**: Primary testing framework for unit, integration, and component tests
- **@testing-library/react**: For React component testing
- **@testing-library/jest-dom**: For DOM testing utilities
- **@testing-library/user-event**: For user interaction testing
- **MSW (Mock Service Worker)**: For API mocking

### Test File Structure

```
xbowl/apps/web/src/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── business-logic/
│   ├── integration/
│   │   ├── server-actions/
│   │   ├── api/
│   │   └── workflows/
│   └── e2e/
│       ├── user-flows/
│       └── workflows/
```

## Test Types and Structure

### 1. Component Tests (Unit Level)

**Purpose**: Test individual React components in isolation
**Framework**: Vitest + @testing-library/react
**Location**: `__tests__/unit/components/`

```tsx
// Example: test-canvas-layout-rendering
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasLayout } from "@/components/canvas/canvas-layout";

describe("CanvasLayout", () => {
  it("renders canvas layout with proper structure and navigation", async () => {
    // Arrange
    const mockUser = { id: "user-1", name: "Test User" };
    const mockWorkspace = { id: "workspace-1", name: "Test Workspace" };

    // Act
    render(<CanvasLayout user={mockUser} workspace={mockWorkspace} />);

    // Assert
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-navigation")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-header")).toBeInTheDocument();
  });

  it("redirects unauthorized users to login", async () => {
    // Arrange
    const mockUser = null;

    // Act
    render(<CanvasLayout user={mockUser} workspace={null} />);

    // Assert
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
```

### 2. Business Logic Tests (Unit Level)

**Purpose**: Test business logic functions, hooks, and utilities
**Framework**: Vitest
**Location**: `__tests__/unit/business-logic/` or `__tests__/unit/hooks/`

```tsx
// Example: test-node-management-logic
import { describe, it, expect, vi } from "vitest";
import {
  validateNodeMetadata,
  createNode,
} from "@/lib/business-logic/node-management";

describe("NodeManagementLogic", () => {
  describe("validateNodeMetadata", () => {
    it("validates node metadata with required fields", () => {
      // Arrange
      const validMetadata = {
        name: "Test Node",
        description: "Test Description",
        slug: "test-node",
        type: "widget",
      };

      // Act
      const result = validateNodeMetadata(validMetadata);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("fails validation for missing required fields", () => {
      // Arrange
      const invalidMetadata = {
        name: "",
        description: "Test Description",
        slug: "",
        type: "widget",
      };

      // Act
      const result = validateNodeMetadata(invalidMetadata);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Name is required");
      expect(result.errors).toContain("Slug is required");
    });
  });
});
```

### 3. Integration Tests

**Purpose**: Test component interactions and data flow
**Framework**: Vitest + @testing-library/react + MSW
**Location**: `__tests__/integration/`

```tsx
// Example: test-canvas-layout-to-workflow-designer-integration
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { CanvasLayout } from "@/components/canvas/canvas-layout";
import { WorkflowDesignerPage } from "@/app/(dashboard)/workflow-designer/page";

const server = setupServer(
  rest.get("/api/workspaces/:id", (req, res, ctx) => {
    return res(
      ctx.json({
        id: "workspace-1",
        name: "Test Workspace",
        permissions: ["read", "write"],
      })
    );
  })
);

describe("Canvas Layout to Workflow Designer Integration", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("seamlessly transitions from layout to page with proper data passing", async () => {
    // Arrange
    const mockUser = { id: "user-1", name: "Test User" };

    // Act
    render(
      <CanvasLayout user={mockUser}>
        <WorkflowDesignerPage />
      </CanvasLayout>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("workflow-designer")).toBeInTheDocument();
    });

    expect(screen.getByTestId("workspace-data")).toHaveTextContent(
      "Test Workspace"
    );
    expect(screen.getByTestId("user-permissions")).toHaveTextContent(
      "read, write"
    );
  });
});
```

### 4. Server Action Tests

**Purpose**: Test server actions and API endpoints
**Framework**: Vitest + MSW
**Location**: `__tests__/integration/server-actions/`

```tsx
// Example: test-workflow-save-logic
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { saveWorkflow } from "@/domains/workflow/actions/save.action";

const server = setupServer(
  rest.post("/api/workflows", (req, res, ctx) => {
    const { name, description, nodes, connections } = req.body;

    if (!name || !nodes || nodes.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ error: "Invalid workflow structure" })
      );
    }

    return res(
      ctx.json({
        id: "workflow-1",
        name,
        description,
        nodes,
        connections,
        createdAt: new Date().toISOString(),
      })
    );
  })
);

describe("WorkflowSaveLogic", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("validates workflow structure and saves correctly", async () => {
    // Arrange
    const validWorkflow = {
      name: "Test Workflow",
      description: "Test Description",
      nodes: [{ id: "node-1", type: "widget", position: { x: 0, y: 0 } }],
      connections: [],
    };

    // Act
    const result = await saveWorkflow(validWorkflow);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("workflow-1");
    expect(result.data.name).toBe("Test Workflow");
  });

  it("fails validation for invalid workflow structure", async () => {
    // Arrange
    const invalidWorkflow = {
      name: "",
      description: "Test Description",
      nodes: [],
      connections: [],
    };

    // Act
    const result = await saveWorkflow(invalidWorkflow);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid workflow structure");
  });
});
```

## Test Data and Mocking

### 1. Test Data Requirements

Based on test-case-US-001.json, include these test data types:

```tsx
// Test data types for workflow designer
const testData = {
  // User authentication data
  user: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    permissions: ["read", "write"],
  },

  // Workspace data
  workspace: {
    id: "workspace-1",
    name: "Test Workspace",
    description: "Test workspace description",
    permissions: ["read", "write"],
  },

  // Node type definitions
  nodeTypes: [
    { id: "widget", name: "Widget", category: "core" },
    { id: "start", name: "Start", category: "flow" },
    { id: "end", name: "End", category: "flow" },
  ],

  // Widget selection data
  widgets: [
    { id: "widget-1", type: "widget", name: "Test Widget", category: "core" },
    {
      id: "widget-2",
      type: "widget",
      name: "Another Widget",
      category: "core",
    },
  ],

  // Node metadata
  nodeMetadata: {
    name: "Test Node",
    description: "Test node description",
    slug: "test-node",
    parameters: { param1: "value1" },
  },

  // Connection validation rules
  connectionRules: {
    allowedConnections: [
      { from: "start", to: "widget" },
      { from: "widget", to: "end" },
    ],
    forbiddenConnections: [{ from: "end", to: "start" }],
  },

  // Workflow save data
  workflowData: {
    name: "Test Workflow",
    description: "Test workflow description",
    nodes: [],
    connections: [],
  },
};
```

### 2. Mocking Strategies

```tsx
// Mock services and external dependencies
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(() => Promise.resolve(testData.user)),
}));

vi.mock("@/lib/workspace", () => ({
  getWorkspace: vi.fn(() => Promise.resolve(testData.workspace)),
}));

vi.mock("@/lib/nodes", () => ({
  getNodeTypes: vi.fn(() => Promise.resolve(testData.nodeTypes)),
  validateNode: vi.fn(() => Promise.resolve({ isValid: true })),
}));

// Mock React components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
```

## Test Execution and Coverage

### 1. Test Execution Order

Follow the test hierarchy from test-case-US-001.json:

```tsx
// Test execution order based on dependencies
describe("Workflow Designer Test Suite", () => {
  // 1. Component tests (unit level)
  describe("Component Tests", () => {
    it("test-canvas-layout-rendering", () => {
      /* ... */
    });
    it("test-workflow-designer-page-loading", () => {
      /* ... */
    });
    it("test-seven-core-node-explorer-rendering", () => {
      /* ... */
    });
    // ... more component tests
  });

  // 2. Business logic tests (unit level)
  describe("Business Logic Tests", () => {
    it("test-node-management-logic", () => {
      /* ... */
    });
    it("test-node-validation-logic", () => {
      /* ... */
    });
    it("test-connection-validation-logic", () => {
      /* ... */
    });
    // ... more business logic tests
  });

  // 3. Integration tests
  describe("Integration Tests", () => {
    it("test-canvas-layout-to-workflow-designer-integration", () => {
      /* ... */
    });
    it("test-workflow-designer-to-explorer-integration", () => {
      /* ... */
    });
    // ... more integration tests
  });
});
```

### 2. Coverage Requirements

```tsx
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## Test Validation

### 1. Validation Rules

```tsx
// Validation rules for different test types
const validationRules = {
  componentTests: {
    mustRender: true,
    mustHandleProps: true,
    mustHandleEvents: true,
    mustBeAccessible: true,
  },

  businessLogicTests: {
    mustValidateInput: true,
    mustHandleErrors: true,
    mustReturnExpectedOutput: true,
    mustBePure: true,
  },

  integrationTests: {
    mustTestDataFlow: true,
    mustTestComponentInteraction: true,
    mustHandleAsyncOperations: true,
    mustTestErrorPropagation: true,
  },

  serverActionTests: {
    mustValidateInput: true,
    mustHandleDatabaseOperations: true,
    mustReturnProperResponse: true,
    mustHandleAuthentication: true,
  },
};
```

## Best Practices

### 1. Test Organization

- **Group by feature**: Organize tests by feature/domain
- **Follow naming conventions**: Use descriptive test names
- **Keep tests focused**: Each test should test one specific behavior
- **Use proper assertions**: Be specific about what you're testing

### 2. Test Data Management

- **Use factories**: Create test data factories for consistent data
- **Clean up**: Always clean up test data after tests
- **Mock external dependencies**: Don't rely on external services in tests
- **Use realistic data**: Use data that resembles real-world scenarios

### 3. Performance and Reliability

- **Fast execution**: Keep tests fast and focused
- **No flaky tests**: Ensure tests are deterministic
- **Proper isolation**: Tests should not depend on each other
- **Clear error messages**: Provide helpful error messages when tests fail

### 4. Maintenance

- **Update tests with code changes**: Keep tests in sync with implementation
- **Review test coverage**: Regularly review and improve test coverage
- **Refactor tests**: Refactor tests when they become complex or unclear
- **Document test patterns**: Document common testing patterns for the team
