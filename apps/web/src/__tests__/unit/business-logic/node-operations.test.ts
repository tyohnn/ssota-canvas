import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNodeOperations } from "@/domains/canvas/hooks/useNodeOperations";
import { testData } from "../../test-data";

// Mock the actions
vi.mock("@/domains/canvas/actions/node.action", () => ({
  createNode: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: "node-1" } })
  ),
  updateNode: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: "node-1" } })
  ),
  deleteNode: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: "node-1" } })
  ),
  getNode: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        id: "node-1",
        node_type: "agent",
        slug: "test-node",
        name: "Test Node",
      },
    })
  ),
  updateNodePosition: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: "node-1" } })
  ),
}));

// Mock NodeManagementLogic
vi.mock("@/domains/canvas/lib/node-management", () => ({
  NodeManagementLogic: {
    validateNodeData: vi.fn(() => Promise.resolve({ valid: true, errors: [] })),
    validateNodeConnection: vi.fn(() =>
      Promise.resolve({ valid: true, errors: [] })
    ),
    getNodeHierarchy: vi.fn(() => Promise.resolve({ success: true, data: {} })),
    validateWorkflowStructure: vi.fn(() =>
      Promise.resolve({ valid: true, errors: [] })
    ),
    createNodeConnection: vi.fn(() =>
      Promise.resolve({ success: true, data: { id: "edge-1" } })
    ),
  },
}));

describe("Node Operations Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles CRUD operations correctly", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act - Create node
    await act(async () => {
      const createResult = await result.current.createNodeWithValidation({
        nodeType: "agent",
        slug: "test-node",
        name: "Test Node",
        metadata: { description: "Test description" },
        workspaceId: testData.workspace.id,
        position: { x: 100, y: 100 },
      });
      expect(createResult.success).toBe(true);
    });

    // Assert
    expect(result.current.lastOperation).toBe("create");
    expect(result.current.loading).toBe(false);

    // Act - Update node
    await act(async () => {
      const updateResult = await result.current.updateNodeWithValidation({
        id: "node-1",
        name: "Updated Node",
        metadata: { description: "Updated description" },
      });
      expect(updateResult.success).toBe(true);
    });

    // Assert
    expect(result.current.lastOperation).toBe("update");

    // Act - Delete node
    await act(async () => {
      const deleteResult =
        await result.current.deleteNodeWithRelationships("node-1");
      expect(deleteResult.success).toBe(true);
    });

    // Assert
    expect(result.current.lastOperation).toBe("delete");
  });

  it("validates node data before creation", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Mock validation to fail
    const { NodeManagementLogic } = await import(
      "@/domains/canvas/lib/node-management"
    );
    vi.mocked(NodeManagementLogic.validateNodeData).mockResolvedValueOnce({
      valid: false,
      errors: ["Name is required", "Slug must be unique"],
    });

    // Act
    await act(async () => {
      const createResult = await result.current.createNodeWithValidation({
        nodeType: "agent",
        slug: "",
        name: "",
        metadata: {},
        workspaceId: testData.workspace.id,
        position: { x: 100, y: 100 },
      });

      // Assert
      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain("Validation failed");
    });

    // Assert
    expect(result.current.validationErrors).toContain("Name is required");
    expect(result.current.validationErrors).toContain("Slug must be unique");
  });

  it("handles node connection validation", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act
    await act(async () => {
      const validationResult = await result.current.validateNodeConnection(
        "node-1",
        "node-2",
        "default"
      );

      // Assert
      expect(validationResult.valid).toBe(true);
    });
  });

  it("handles node movement", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act
    await act(async () => {
      const moveResult = await result.current.moveNode("node-1", {
        x: 200,
        y: 300,
      });
      expect(moveResult.success).toBe(true);
    });

    // Assert
    expect(result.current.lastOperation).toBe("move");
  });

  it("handles invalid operations gracefully", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Mock action to fail
    const { createNode } = await import("@/domains/canvas/actions/node.action");
    vi.mocked(createNode).mockRejectedValueOnce(new Error("Database error"));

    // Act
    await act(async () => {
      const createResult = await result.current.createNodeWithValidation({
        nodeType: "agent",
        slug: "test-node",
        name: "Test Node",
        metadata: {},
        workspaceId: testData.workspace.id,
        position: { x: 100, y: 100 },
      });

      // Assert
      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain("Database error");
    });

    // Assert
    expect(result.current.error).toContain("Database error");
  });

  it("handles concurrent operations safely", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act - Start multiple operations
    await act(async () => {
      const promises = [
        result.current.createNodeWithValidation({
          nodeType: "agent",
          slug: "node-1",
          name: "Node 1",
          metadata: {},
          workspaceId: testData.workspace.id,
          position: { x: 100, y: 100 },
        }),
        result.current.createNodeWithValidation({
          nodeType: "task",
          slug: "node-2",
          name: "Node 2",
          metadata: {},
          workspaceId: testData.workspace.id,
          position: { x: 200, y: 200 },
        }),
      ];

      const results = await Promise.all(promises);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
    });

    // Assert
    expect(result.current.lastOperation).toBe("create");
  });

  it("validates node connections correctly", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Mock connection validation to fail
    const { NodeManagementLogic } = await import(
      "@/domains/canvas/lib/node-management"
    );
    vi.mocked(NodeManagementLogic.validateNodeConnection).mockResolvedValueOnce(
      {
        valid: false,
        errors: ["Circular dependency detected"],
      }
    );

    // Act
    await act(async () => {
      const validationResult = await result.current.validateNodeConnection(
        "node-1",
        "node-2",
        "default"
      );

      // Assert
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain("Circular dependency detected");
    });
  });

  it("creates node connections successfully", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act
    await act(async () => {
      const connectionResult = await result.current.createNodeConnection(
        "node-1",
        "node-2",
        "default",
        { label: "Connection" }
      );

      // Assert
      expect(connectionResult.success).toBe(true);
    });
  });

  it("handles loading states correctly", async () => {
    // Arrange
    const { result } = renderHook(() => useNodeOperations());

    // Act - Start operation
    const createPromise = result.current.createNodeWithValidation({
      nodeType: "agent",
      slug: "test-node",
      name: "Test Node",
      metadata: {},
      workspaceId: testData.workspace.id,
      position: { x: 100, y: 100 },
    });

    // Assert - Should be loading
    expect(result.current.loading).toBe(true);

    // Act - Wait for completion
    await act(async () => {
      await createPromise;
    });

    // Assert - Should not be loading
    expect(result.current.loading).toBe(false);
  });
});
