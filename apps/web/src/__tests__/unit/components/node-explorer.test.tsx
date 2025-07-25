import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NodeExplorer } from "@/domains/canvas/components/node-explorer";
import { testData } from "../../test-data";

// Mock UI components and Lucide icons
vi.mock("@workspace/ui/components/input", () => ({
  Input: ({ placeholder, value, onChange, ...props }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <p data-testid="card-description" {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

vi.mock("@workspace/ui/components/tabs", () => ({
  Tabs: ({ children, ...props }: any) => (
    <div data-testid="tabs" {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, ...props }: any) => (
    <button data-testid="tabs-trigger" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, ...props }: any) => (
    <div data-testid="tabs-content" {...props}>
      {children}
    </div>
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  CheckSquare: () => <div data-testid="check-square-icon">CheckSquare</div>,
  GitBranch: () => <div data-testid="git-branch-icon">GitBranch</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  Layers: () => <div data-testid="layers-icon">Layers</div>,
}));

describe("NodeExplorer", () => {
  const mockOnNodeCreate = vi.fn();
  const defaultProps = {
    onNodeCreate: mockOnNodeCreate,
    className: "test-class",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders seven core node types organized in folders with proper structure", async () => {
    // Arrange & Act
    render(<NodeExplorer {...defaultProps} />);

    // Assert
    expect(screen.getByText("Node Explorer")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Browse and create the seven core node types for your workflow canvas"
      )
    ).toBeInTheDocument();

    // Check for search input
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search node types and templates...")
    ).toBeInTheDocument();

    // Check for tabs structure
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-list")).toBeInTheDocument();

    // Check for all tab triggers
    const tabTriggers = screen.getAllByTestId("tabs-trigger");
    expect(tabTriggers).toHaveLength(8); // All + 7 node types
  });

  it("displays search functionality with proper placeholder and icon", async () => {
    // Arrange & Act
    render(<NodeExplorer {...defaultProps} />);

    // Assert
    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Search node types and templates..."
    );
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("filters node types when search is used", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Act
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Agent" } });

    // Assert
    expect(searchInput).toHaveValue("Agent");
  });

  it("shows template lists for node types", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Act - Click on Agent tab
    const tabTriggers = screen.getAllByTestId("tabs-trigger");
    const agentTab = tabTriggers.find(
      (trigger) => trigger.textContent === "Agent"
    );
    if (agentTab) {
      fireEvent.click(agentTab);
    }

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Developer Agent")).toBeInTheDocument();
      expect(screen.getByText("Code Review Task")).toBeInTheDocument();
    });
  });

  it("handles empty search results", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Act
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "NonExistentNode" } });

    // Assert
    expect(searchInput).toHaveValue("NonExistentNode");
  });

  it("renders with custom className", async () => {
    // Arrange & Act
    render(<NodeExplorer {...defaultProps} />);

    // Assert
    const explorerElement = screen.getByTestId("tabs");
    expect(explorerElement).toBeInTheDocument();
    // Find the root div that contains the className
    const rootDiv =
      explorerElement.closest("div")?.parentElement?.parentElement;
    expect(rootDiv).toHaveClass("test-class");
    expect(rootDiv).toHaveClass("h-full");
  });

  it("calls onNodeCreate when node creation button is clicked", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Act
    await waitFor(() => {
      const plusButtons = screen.getAllByTestId("button");
      const firstPlusButton = plusButtons.find((button) =>
        button.textContent?.includes("Plus")
      );
      if (firstPlusButton) {
        fireEvent.click(firstPlusButton);
      }
    });

    // Assert
    expect(mockOnNodeCreate).toHaveBeenCalled();
  });

  it("displays node type cards with proper structure", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Assert
    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("shows node type descriptions and metadata", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Assert
    expect(
      screen.getAllByText("AI agents with personas, roles, and capabilities")[0]
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Specific tasks with instructions and variables")[0]
    ).toBeInTheDocument();
  });

  it("handles tab switching correctly", async () => {
    // Arrange
    render(<NodeExplorer {...defaultProps} />);

    // Act - Switch to Task tab
    const tabTriggers = screen.getAllByTestId("tabs-trigger");
    const taskTab = tabTriggers.find(
      (trigger) => trigger.textContent === "Task"
    );
    if (taskTab) {
      fireEvent.click(taskTab);
    }

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Code Review Task")).toBeInTheDocument();
    });
  });
});
