// Test data for US-001: Design Workflow in Visual Canvas
export const testData = {
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
    { id: "conditional", name: "Conditional", category: "flow" },
    { id: "agent", name: "Agent", category: "core" },
    { id: "artifact-class", name: "Artifact Class", category: "core" },
    { id: "artifact-template", name: "Artifact Template", category: "core" },
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
    { id: "agent-1", type: "agent", name: "Test Agent", category: "core" },
    {
      id: "artifact-class-1",
      type: "artifact-class",
      name: "Test Artifact Class",
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
      { from: "start", to: "agent" },
      { from: "agent", to: "artifact-class" },
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

  // Canvas state
  canvasState: {
    nodes: [],
    edges: [],
    mode: "design",
    selectedNode: null,
  },
};

// Mock responses for API calls
export const mockResponses = {
  workspace: {
    success: {
      id: "workspace-1",
      name: "Test Workspace",
      description: "Test workspace description",
      permissions: ["read", "write"],
    },
    error: {
      error: "Workspace not found",
      status: 404,
    },
  },

  nodeTypes: {
    success: testData.nodeTypes,
    error: {
      error: "Failed to load node types",
      status: 500,
    },
  },

  saveWorkflow: {
    success: {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test workflow description",
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
    },
    error: {
      error: "Invalid workflow structure",
      status: 400,
    },
  },
};
