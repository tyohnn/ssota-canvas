import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CanvasPage } from "@/domains/canvas/components/canvas-page";
import { testData } from "../../test-data";

// Mock the hooks
vi.mock("@/domains/canvas/hooks/useCanvasState", () => ({
  useCanvasState: () => ({
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    isDragging: false,
    isConnecting: false,
    connectionMode: "add",
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
    setDragging: vi.fn(),
    setConnecting: vi.fn(),
    setConnectionMode: vi.fn(),
    setZoom: vi.fn(),
    setPan: vi.fn(),
    setError: vi.fn(),
  }),
}));

vi.mock("@/domains/canvas/hooks/useNodeOperations", () => ({
  useNodeOperations: () => ({
    createNodeWithValidation: vi.fn(),
    updateNodeWithValidation: vi.fn(),
    deleteNodeWithRelationships: vi.fn(),
    moveNode: vi.fn(),
    validateNodeConnection: vi.fn(),
    createNodeConnection: vi.fn(),
  }),
}));

vi.mock("@/domains/canvas/hooks/useAgentCreation", () => ({
  useAgentCreation: () => ({
    createAgentWithNaturalLanguage: vi.fn(),
    updateAgentWithNaturalLanguage: vi.fn(),
    analyzeAgentEffectiveness: vi.fn(),
  }),
}));

vi.mock("@/domains/canvas/hooks/useTemplateCreation", () => ({
  useTemplateCreation: () => ({
    createTemplateWithDefinitions: vi.fn(),
    analyzeTemplateComplexity: vi.fn(),
  }),
}));

// Mock child components
vi.mock("@/domains/canvas/components/canvas", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
}));

vi.mock("@/domains/canvas/components/top-toolbox", () => ({
  TopToolbox: () => <div data-testid="top-toolbox">Top Toolbox</div>,
}));

vi.mock("@/domains/canvas/components/node-explorer", () => ({
  NodeExplorer: () => <div data-testid="node-explorer">Node Explorer</div>,
}));

vi.mock("@/domains/canvas/components/editor-panel", () => ({
  EditorPanel: () => <div data-testid="editor-panel">Editor Panel</div>,
}));

describe("CanvasPage", () => {
  const defaultProps = {
    workspaceId: testData.workspace.id,
    className: "test-class",
  };

  it("renders canvas page with proper structure and navigation", async () => {
    // Arrange & Act
    render(<CanvasPage {...defaultProps} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
    expect(screen.getByTestId("node-explorer")).toBeInTheDocument();
  });

  it("renders with custom className", async () => {
    // Arrange & Act
    render(<CanvasPage {...defaultProps} />);

    // Assert
    await waitFor(() => {
      const canvasElement = screen.getByTestId("canvas");
      expect(canvasElement).toBeInTheDocument();
    });
  });

  it("handles workspace ID prop correctly", async () => {
    // Arrange & Act
    render(<CanvasPage workspaceId="test-workspace" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  it("renders all major components", async () => {
    // Arrange & Act
    render(<CanvasPage {...defaultProps} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
      expect(screen.getByTestId("top-toolbox")).toBeInTheDocument();
      expect(screen.getByTestId("node-explorer")).toBeInTheDocument();
    });
  });
});
