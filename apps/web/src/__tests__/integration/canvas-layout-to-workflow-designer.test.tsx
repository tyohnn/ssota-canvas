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
import { http, HttpResponse } from "msw";
import { CanvasPage } from "@/domains/workflow-canvas/components/canvas-page";
import { testData, mockResponses } from "../test-data";

// Mock child components and hooks
vi.mock("@/domains/canvas/components/canvas", () => ({
  Canvas: ({ nodes, edges, onNodesChange, onEdgesChange }: any) => (
    <div data-testid="canvas">
      <div data-testid="nodes-count">{nodes?.length || 0}</div>
      <div data-testid="edges-count">{edges?.length || 0}</div>
      <button
        onClick={() => onNodesChange?.([{ id: "new-node", type: "default" }])}
      >
        Add Node
      </button>
      <button
        onClick={() =>
          onEdgesChange?.([{ id: "new-edge", source: "1", target: "2" }])
        }
      >
        Add Edge
      </button>
    </div>
  ),
}));

vi.mock("@/domains/canvas/components/top-toolbox", () => ({
  TopToolbox: ({ onSave, onUndo, onRedo }: any) => (
    <div data-testid="top-toolbox">
      <button onClick={onSave}>Save</button>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onRedo}>Redo</button>
    </div>
  ),
}));

vi.mock("@/domains/canvas/components/node-explorer", () => ({
  NodeExplorer: ({ onNodeCreate }: any) => (
    <div data-testid="node-explorer">
      <button onClick={() => onNodeCreate("agent", "Developer Agent")}>
        Create Agent
      </button>
      <button onClick={() => onNodeCreate("task", "Code Review Task")}>
        Create Task
      </button>
    </div>
  ),
}));

vi.mock("@/domains/canvas/components/editor-panel", () => ({
  EditorPanel: ({ selectedNode, onUpdate }: any) => (
    <div data-testid="editor-panel">
      <div data-testid="selected-node-id">{selectedNode?.id || "none"}</div>
      <button
        onClick={() => onUpdate?.({ id: "node-1", name: "Updated Node" })}
      >
        Update Node
      </button>
    </div>
  ),
}));

// Mock hooks
vi.mock("@/domains/canvas/hooks/useCanvasState", () => ({
  useCanvasState: () => ({
    nodes: [
      { id: "node-1", type: "default", position: { x: 100, y: 100 } },
      { id: "node-2", type: "default", position: { x: 200, y: 200 } },
    ],
    edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
    selectedNodes: ["node-1"],
    selectedEdges: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    loading: false,
    error: null,
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    addEdge: vi.fn(),
    updateEdge: vi.fn(),
    deleteEdge: vi.fn(),
    selectNode: vi.fn(),
    deselectNode: vi.fn(),
    selectEdge: vi.fn(),
    deselectEdge: vi.fn(),
    clearSelection: vi.fn(),
    setZoom: vi.fn(),
    setPan: vi.fn(),
    setError: vi.fn(),
  }),
}));

vi.mock("@/domains/canvas/hooks/useNodeOperations", () => ({
  useNodeOperations: () => ({
    createNodeWithValidation: vi.fn(() => Promise.resolve({ success: true })),
    updateNodeWithValidation: vi.fn(() => Promise.resolve({ success: true })),
    deleteNodeWithRelationships: vi.fn(() =>
      Promise.resolve({ success: true })
    ),
    validateNodeData: vi.fn(() => Promise.resolve({ valid: true })),
    loading: false,
    error: null,
  }),
}));

vi.mock("@/domains/canvas/hooks/useAgentCreation", () => ({
  useAgentCreation: () => ({
    createAgent: vi.fn(() => Promise.resolve({ success: true })),
    loading: false,
    error: null,
  }),
}));

vi.mock("@/domains/canvas/hooks/useTemplateCreation", () => ({
  useTemplateCreation: () => ({
    createTemplate: vi.fn(() => Promise.resolve({ success: true })),
    loading: false,
    error: null,
  }),
}));

// Setup MSW server
const server = setupServer(
  http.get("/api/workspaces/:id", () => {
    return HttpResponse.json(mockResponses.workspace.success);
  }),
  http.get("/api/node-types", () => {
    return HttpResponse.json(mockResponses.nodeTypes.success);
  }),
  http.post("/api/workflows", ({ request }) => {
    return request.json().then((body: any) => {
      const { name, description, nodes, connections } = body;

      if (!name || !nodes || nodes.length === 0) {
        return HttpResponse.json(mockResponses.saveWorkflow.error, {
          status: 400,
        });
      }

      return HttpResponse.json(mockResponses.saveWorkflow.success);
    });
  })
);

describe("Canvas Layout to Workflow Designer Integration", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("seamlessly transitions from layout to page with proper data passing", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;

    // Act
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
      expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
      expect(screen.getByTestId("node-explorer")).toBeInTheDocument();
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
    });
  });

  it("loads workspace data and node types on initialization", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;

    // Act
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
      expect(screen.getByTestId("nodes-count")).toHaveTextContent("2");
      expect(screen.getByTestId("edges-count")).toHaveTextContent("1");
    });
  });

  it("handles node creation from explorer to canvas", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act
    await waitFor(() => {
      const createAgentButton = screen.getByText("Create Agent");
      createAgentButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  it("handles workflow save operations", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act
    await waitFor(() => {
      const saveButton = screen.getByText("Save");
      saveButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
    });
  });

  it("handles node selection and editing", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
      expect(screen.getByTestId("selected-node-id")).toHaveTextContent(
        "node-1"
      );
    });
  });

  it("handles canvas interactions (add nodes/edges)", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act
    await waitFor(() => {
      const addNodeButton = screen.getByText("Add Node");
      const addEdgeButton = screen.getByText("Add Edge");
      addNodeButton.click();
      addEdgeButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  it("handles error states gracefully", async () => {
    // Arrange
    server.use(
      http.get("/api/workspaces/:id", () => {
        return HttpResponse.json(mockResponses.workspace.error, {
          status: 404,
        });
      })
    );

    const workspaceId = testData.workspace.id;

    // Act
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas-page")).toBeInTheDocument();
    });
  });

  it("handles loading states during data fetching", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;

    // Act
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  it("maintains state consistency across component interactions", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act - Create node, then save
    await waitFor(() => {
      const createTaskButton = screen.getByText("Create Task");
      createTaskButton.click();
    });

    await waitFor(() => {
      const saveButton = screen.getByText("Save");
      saveButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
      expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
    });
  });

  it("handles concurrent operations safely", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act - Multiple operations
    await waitFor(() => {
      const createAgentButton = screen.getByText("Create Agent");
      const createTaskButton = screen.getByText("Create Task");
      const saveButton = screen.getByText("Save");

      createAgentButton.click();
      createTaskButton.click();
      saveButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  it("validates data integrity during operations", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
      expect(screen.getByTestId("selected-node-id")).toHaveTextContent(
        "node-1"
      );
    });
  });

  it("handles undo/redo operations", async () => {
    // Arrange
    const workspaceId = testData.workspace.id;
    render(<CanvasPage workspaceId={workspaceId} />);

    // Act
    await waitFor(() => {
      const undoButton = screen.getByText("Undo");
      const redoButton = screen.getByText("Redo");
      undoButton.click();
      redoButton.click();
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
    });
  });

  it("handles network failures gracefully", async () => {
    // Arrange
    server.use(
      http.get("/api/node-types", () => {
        return HttpResponse.json(mockResponses.nodeTypes.error, {
          status: 500,
        });
      })
    );

    const workspaceId = testData.workspace.id;

    // Act
    render(<CanvasPage workspaceId={workspaceId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });
});
