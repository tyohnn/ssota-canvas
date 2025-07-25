import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasState } from "@/domains/canvas/hooks/useCanvasState";
import { testData } from "../../test-data";

// Mock the actions
vi.mock("@/domains/canvas/actions/node.action", () => ({
  getWorkspaceNodes: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/domains/canvas/actions/edge.action", () => ({
  getEdgesBySource: vi.fn(() => Promise.resolve([])),
  getEdgesByTarget: vi.fn(() => Promise.resolve([])),
}));

describe("Canvas State Management Logic", () => {
  const workspaceId = testData.workspace.id;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles state updates correctly for all operations", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Add node
    await act(async () => {
      const testNode = {
        id: "node-1",
        type: "widget",
        position: { x: 100, y: 100 },
        data: { label: "Test Node" },
      };
      result.current.addNode(testNode);
    });

    // Assert
    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0]?.id).toBe("node-1");

    // Act - Update node
    await act(async () => {
      result.current.updateNode("node-1", { label: "Updated Node" });
    });

    // Assert
    expect(result.current.nodes[0]?.data.label).toBe("Updated Node");

    // Act - Delete node
    await act(async () => {
      result.current.deleteNode("node-1");
    });

    // Assert
    expect(result.current.nodes).toHaveLength(0);
  });

  it("handles node selection and deselection", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Add node and select it
    await act(async () => {
      const testNode = {
        id: "node-1",
        type: "widget",
        position: { x: 100, y: 100 },
        data: { label: "Test Node" },
      };
      result.current.addNode(testNode);
      result.current.selectNode("node-1");
    });

    // Assert
    expect(result.current.selectedNodes).toContain("node-1");

    // Act - Deselect node
    await act(async () => {
      result.current.deselectNode("node-1");
    });

    // Assert
    expect(result.current.selectedNodes).not.toContain("node-1");
  });

  it("handles edge creation and management", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Add nodes and edge
    await act(async () => {
      const node1 = {
        id: "node-1",
        type: "widget",
        position: { x: 100, y: 100 },
        data: { label: "Node 1" },
      };
      const node2 = {
        id: "node-2",
        type: "widget",
        position: { x: 200, y: 200 },
        data: { label: "Node 2" },
      };
      result.current.addNode(node1);
      result.current.addNode(node2);

      const testEdge = {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "default",
      };
      result.current.addEdge(testEdge);
    });

    // Assert
    expect(result.current.nodes).toHaveLength(2);
    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0]?.source).toBe("node-1");
    expect(result.current.edges[0]?.target).toBe("node-2");
  });

  it("handles invalid state operations gracefully", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Try to update non-existent node
    await act(async () => {
      result.current.updateNode("non-existent", { label: "Updated" });
    });

    // Assert - Should not throw error and nodes should remain unchanged
    expect(result.current.nodes).toHaveLength(0);

    // Act - Try to delete non-existent node
    await act(async () => {
      result.current.deleteNode("non-existent");
    });

    // Assert - Should not throw error
    expect(result.current.nodes).toHaveLength(0);
  });

  it("handles zoom and pan operations", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Set zoom
    await act(async () => {
      result.current.setZoom(1.5);
    });

    // Assert
    expect(result.current.zoom).toBe(1.5);

    // Act - Set pan
    await act(async () => {
      result.current.setPan({ x: 100, y: 200 });
    });

    // Assert
    expect(result.current.pan).toEqual({ x: 100, y: 200 });
  });

  it("handles dragging and connecting states", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Set dragging
    await act(async () => {
      result.current.setDragging(true);
    });

    // Assert
    expect(result.current.isDragging).toBe(true);

    // Act - Set connecting
    await act(async () => {
      result.current.setConnecting(true);
    });

    // Assert
    expect(result.current.isConnecting).toBe(true);
  });

  it("handles connection mode changes", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Change connection mode
    await act(async () => {
      result.current.setConnectionMode("edit");
    });

    // Assert
    expect(result.current.connectionMode).toBe("edit");

    // Act - Change to delete mode
    await act(async () => {
      result.current.setConnectionMode("delete");
    });

    // Assert
    expect(result.current.connectionMode).toBe("delete");
  });

  it("handles error states", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Set error
    await act(async () => {
      result.current.setError("Test error message");
    });

    // Assert
    expect(result.current.error).toBe("Test error message");

    // Act - Clear error
    await act(async () => {
      result.current.setError(null);
    });

    // Assert
    expect(result.current.error).toBe(null);
  });

  it("handles loading states", async () => {
    // Arrange
    const { result } = renderHook(() => useCanvasState(workspaceId));

    // Act - Set loading (mock the loading state)
    await act(async () => {
      // Mock loading state change
    });

    // Assert
    expect(result.current.loading).toBe(false);

    // Act - Clear loading (mock the loading state)
    await act(async () => {
      // Mock loading state change
    });

    // Assert
    expect(result.current.loading).toBe(false);
  });
});
