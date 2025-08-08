import { Workspace, Block, BlockPosition, Edge } from "@/db/schema";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";

/**
 * 🎯 MOCKUP DATA FOR CANVAS
 * ==========================
 *
 * 📋 파일 역할:
 * - 캔버스 페이지에서 사용할 정적 샘플 데이터
 * - 개발 및 테스트를 위한 목업 데이터 제공
 * - 실제 데이터베이스 스키마와 일치하는 구조
 *
 * 🔧 주요 데이터:
 * - Workspace: AI Workflow Studio
 * - Nodes: 워크플로우, 에이전트, 태스크, 아티팩트 등
 * - NodePositions: 노드들의 캔버스 위치
 * - Edges: 노드 간의 관계 (contains, input, output, used_by, accesses)
 */

// 정적 샘플 데이터
export const sampleWorkspace: Workspace = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "AI Workflow Studio",
  description: "AI Workflow Studio",
  metadata: {},
  owner_id: "user_2abc123def456",
  created_at: new Date("2025-01-27T10:00:00Z"),
  updated_at: new Date("2025-01-27T10:00:00Z"),
};

export const sampleBlocks: DbBlock[] = [
  {
    id: "node_001",
    block_type: "workflow",
    slug: "development-workflow",
    name: "Development Workflow",
    metadata: {
      description: "Complete development workflow from planning to deployment",
      steps: ["analysis", "design", "implementation", "testing", "deployment"],
      triggers: ["manual", "git_push"],
      agents: ["analyst", "developer", "qa"],
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:30:00Z"),
    updated_at: new Date("2025-01-27T10:30:00Z"),
  },
  {
    id: "node_002",
    block_type: "agent",
    slug: "data-analysis-agent",
    name: "Data Analysis Agent",
    metadata: {
      persona:
        "A specialized AI agent for data analysis and insights generation. Expert in statistical analysis, data visualization, and extracting actionable insights from complex datasets.",
      role: "Analyze datasets and provide actionable insights",
      capabilities: [
        "data_processing",
        "statistical_analysis",
        "visualization",
      ],
      tools: ["pandas", "numpy", "matplotlib"],
      model: "gpt-4",
      temperature: 0.3,
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:31:00Z"),
    updated_at: new Date("2025-01-27T10:31:00Z"),
  },
  {
    id: "node_003",
    block_type: "task",
    slug: "process-csv-data",
    name: "Process CSV Data",
    metadata: {
      instructions: "Load and clean CSV data from the input source",
      variables: {
        input_file: "data.csv",
        output_format: "json",
      },
      timeout: 300,
      retry_count: 3,
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:35:00Z"),
    updated_at: new Date("2025-01-27T10:35:00Z"),
  },
  {
    id: "node_004",
    block_type: "workflow",
    slug: "data-pipeline",
    name: "Data Pipeline",
    metadata: {
      description:
        "Complete data processing pipeline from raw data to insights",
      steps: ["load", "clean", "analyze", "visualize"],
      triggers: ["manual", "scheduled"],
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:40:00Z"),
    updated_at: new Date("2025-01-27T10:40:00Z"),
  },
  {
    id: "node_005",
    block_type: "artifact_template",
    slug: "report-template",
    name: "Report Template",
    metadata: {
      artifact_format: "markdown",
      definitions: [
        {
          name: "title",
          type: "string",
          required: true,
        },
        {
          name: "summary",
          type: "text",
          required: true,
        },
        {
          name: "charts",
          type: "array",
          required: false,
        },
      ],
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:45:00Z"),
    updated_at: new Date("2025-01-27T10:45:00Z"),
  },
  {
    id: "node_007",
    block_type: "artifact_class",
    slug: "report-template-class",
    name: "Report Template Class",
    metadata: {
      class_name: "ReportTemplate",
      properties: [
        {
          name: "title",
          type: "string",
          required: true,
        },
        {
          name: "summary",
          type: "text",
          required: true,
        },
        {
          name: "charts",
          type: "array",
          required: false,
        },
      ],
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:46:00Z"),
    updated_at: new Date("2025-01-27T10:46:00Z"),
  },
  {
    id: "node_006",
    block_type: "checklist",
    slug: "data-validation",
    name: "Data Validation Checklist",
    metadata: {
      items: [
        "Check for missing values",
        "Validate data types",
        "Check for outliers",
        "Verify data integrity",
      ],
      completion_criteria: "All items must be completed",
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:50:00Z"),
    updated_at: new Date("2025-01-27T10:50:00Z"),
  },
  {
    id: "node_008",
    block_type: "data",
    slug: "customer-data",
    name: "Customer Data",
    metadata: {
      data_type: "csv",
      columns: ["id", "name", "email", "purchase_date", "amount"],
      source: "database",
      update_frequency: "daily",
    },
    parent_block_id: null,
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:51:00Z"),
    updated_at: new Date("2025-01-27T10:51:00Z"),
  },
];

export const sampleBlockPositions: BlockPosition[] = [
  // =================================================================
  // CONTEXT-BASED POSITIONS - Same block can have different positions in different page contexts
  // =================================================================

  // 🔸 Positions in Agent Page Context (node_002: Data Analysis Agent)
  // When viewed from Agent page, resources appear around the agent
  {
    id: "pos_agent_in_agent_context",
    block_id: "node_002", // Data Analysis Agent (center)
    context_block_id: "node_002", // Agent page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:30:00Z"),
    updated_at: new Date("2025-01-27T10:30:00Z"),
  },
  {
    id: "pos_checklist_in_agent_context",
    block_id: "node_006", // Data Validation Checklist (left of agent)
    context_block_id: "node_002", // Agent page context
    x_position: 100,
    y_position: 300,
    created_at: new Date("2025-01-27T10:31:00Z"),
    updated_at: new Date("2025-01-27T10:31:00Z"),
  },
  {
    id: "pos_template_in_agent_context",
    block_id: "node_005", // Report Template (right of agent)
    context_block_id: "node_002", // Agent page context
    x_position: 700,
    y_position: 200,
    created_at: new Date("2025-01-27T10:32:00Z"),
    updated_at: new Date("2025-01-27T10:32:00Z"),
  },
  {
    id: "pos_artifact_class_in_agent_context",
    block_id: "node_007", // Report Template Class (right of agent)
    context_block_id: "node_002", // Agent page context
    x_position: 700,
    y_position: 400,
    created_at: new Date("2025-01-27T10:33:00Z"),
    updated_at: new Date("2025-01-27T10:33:00Z"),
  },
  {
    id: "pos_data_in_agent_context",
    block_id: "node_008", // Customer Data (bottom of agent)
    context_block_id: "node_002", // Agent page context
    x_position: 400,
    y_position: 500,
    created_at: new Date("2025-01-27T10:34:00Z"),
    updated_at: new Date("2025-01-27T10:34:00Z"),
  },

  // 🔸 Positions in Task Page Context (node_003: Process CSV Data)
  // When viewed from Task page, inputs/outputs appear around the task
  {
    id: "pos_task_in_task_context",
    block_id: "node_003", // Process CSV Data (center)
    context_block_id: "node_003", // Task page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:35:00Z"),
    updated_at: new Date("2025-01-27T10:35:00Z"),
  },
  {
    id: "pos_template_in_task_context",
    block_id: "node_005", // Report Template (left input)
    context_block_id: "node_003", // Task page context
    x_position: 150,
    y_position: 250,
    created_at: new Date("2025-01-27T10:36:00Z"),
    updated_at: new Date("2025-01-27T10:36:00Z"),
  },
  {
    id: "pos_checklist_in_task_context",
    block_id: "node_006", // Data Validation Checklist (left input)
    context_block_id: "node_003", // Task page context
    x_position: 150,
    y_position: 350,
    created_at: new Date("2025-01-27T10:37:00Z"),
    updated_at: new Date("2025-01-27T10:37:00Z"),
  },
  {
    id: "pos_artifact_class_in_task_context",
    block_id: "node_007", // Report Template Class (right output)
    context_block_id: "node_003", // Task page context
    x_position: 650,
    y_position: 300,
    created_at: new Date("2025-01-27T10:38:00Z"),
    updated_at: new Date("2025-01-27T10:38:00Z"),
  },
  {
    id: "pos_workflow_in_task_context",
    block_id: "node_001", // Development Workflow (contains this task)
    context_block_id: "node_003", // Task page context
    x_position: 400,
    y_position: 100, // Task 위쪽에 배치
    created_at: new Date("2025-01-27T10:39:00Z"),
    updated_at: new Date("2025-01-27T10:39:00Z"),
  },

  // 🔸 Positions in Workflow Page Context (node_001: Development Workflow)
  // When viewed from Workflow page, tasks and workflow-specific blocks appear
  {
    id: "pos_workflow_in_workflow_context",
    block_id: "node_001", // Development Workflow (center)
    context_block_id: "node_001", // Workflow page context
    x_position: 400,
    y_position: 200,
    created_at: new Date("2025-01-27T10:39:00Z"),
    updated_at: new Date("2025-01-27T10:39:00Z"),
  },
  {
    id: "pos_agent_in_workflow_context",
    block_id: "node_002", // Data Analysis Agent (workflow component)
    context_block_id: "node_001", // Workflow page context
    x_position: 200,
    y_position: 350,
    created_at: new Date("2025-01-27T10:40:00Z"),
    updated_at: new Date("2025-01-27T10:40:00Z"),
  },
  {
    id: "pos_task_in_workflow_context",
    block_id: "node_003", // Process CSV Data (workflow component)
    context_block_id: "node_001", // Workflow page context
    x_position: 600,
    y_position: 350,
    created_at: new Date("2025-01-27T10:41:00Z"),
    updated_at: new Date("2025-01-27T10:41:00Z"),
  },

  // 🔸 Positions in Checklist Page Context (node_006: Data Validation Checklist)
  // When viewed from Checklist page, users of this checklist appear
  {
    id: "pos_checklist_in_checklist_context",
    block_id: "node_006", // Data Validation Checklist (center)
    context_block_id: "node_006", // Checklist page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:42:00Z"),
    updated_at: new Date("2025-01-27T10:42:00Z"),
  },
  {
    id: "pos_agent_in_checklist_context",
    block_id: "node_002", // Data Analysis Agent (checklist user)
    context_block_id: "node_006", // Checklist page context
    x_position: 600,
    y_position: 200,
    created_at: new Date("2025-01-27T10:43:00Z"),
    updated_at: new Date("2025-01-27T10:43:00Z"),
  },
  {
    id: "pos_task_in_checklist_context",
    block_id: "node_003", // Process CSV Data (checklist user)
    context_block_id: "node_006", // Checklist page context
    x_position: 600,
    y_position: 400,
    created_at: new Date("2025-01-27T10:44:00Z"),
    updated_at: new Date("2025-01-27T10:44:00Z"),
  },

  // 🔸 Positions in Data Page Context (node_008: Customer Data)
  // When viewed from Data page, consumers of this data appear
  {
    id: "pos_data_in_data_context",
    block_id: "node_008", // Customer Data (center)
    context_block_id: "node_008", // Data page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:45:00Z"),
    updated_at: new Date("2025-01-27T10:45:00Z"),
  },
  {
    id: "pos_agent_in_data_context",
    block_id: "node_002", // Data Analysis Agent (data consumer)
    context_block_id: "node_008", // Data page context
    x_position: 600,
    y_position: 300,
    created_at: new Date("2025-01-27T10:46:00Z"),
    updated_at: new Date("2025-01-27T10:46:00Z"),
  },

  // 🔸 Positions in Template Page Context (node_005: Report Template)
  // When viewed from Template page, users of this template appear
  {
    id: "pos_template_in_template_context",
    block_id: "node_005", // Report Template (center)
    context_block_id: "node_005", // Template page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:47:00Z"),
    updated_at: new Date("2025-01-27T10:47:00Z"),
  },
  {
    id: "pos_task_in_template_context",
    block_id: "node_003", // Process CSV Data (template user)
    context_block_id: "node_005", // Template page context
    x_position: 600,
    y_position: 200,
    created_at: new Date("2025-01-27T10:48:00Z"),
    updated_at: new Date("2025-01-27T10:48:00Z"),
  },
  {
    id: "pos_agent_in_template_context",
    block_id: "node_002", // Data Analysis Agent (template user)
    context_block_id: "node_005", // Template page context
    x_position: 600,
    y_position: 400,
    created_at: new Date("2025-01-27T10:49:00Z"),
    updated_at: new Date("2025-01-27T10:49:00Z"),
  },

  // 🔸 Positions in Artifact Class Page Context (node_007: Report Template Class)
  // When viewed from Artifact Class page, users of this class appear
  {
    id: "pos_artifact_class_in_artifact_class_context",
    block_id: "node_007", // Report Template Class (center)
    context_block_id: "node_007", // Artifact Class page context
    x_position: 400,
    y_position: 300,
    created_at: new Date("2025-01-27T10:50:00Z"),
    updated_at: new Date("2025-01-27T10:50:00Z"),
  },
  {
    id: "pos_task_in_artifact_class_context",
    block_id: "node_003", // Process CSV Data (class user)
    context_block_id: "node_007", // Artifact Class page context
    x_position: 600,
    y_position: 200,
    created_at: new Date("2025-01-27T10:51:00Z"),
    updated_at: new Date("2025-01-27T10:51:00Z"),
  },
  {
    id: "pos_agent_in_artifact_class_context",
    block_id: "node_002", // Data Analysis Agent (class user)
    context_block_id: "node_007", // Artifact Class page context
    x_position: 600,
    y_position: 400,
    created_at: new Date("2025-01-27T10:52:00Z"),
    updated_at: new Date("2025-01-27T10:52:00Z"),
  },
];

export const sampleEdges: Edge[] = [
  {
    id: "edge_001",
    source_block_id: "node_001",
    target_block_id: "node_002",
    edge_type: "contains",
    metadata: {
      relationship_type: "workflow_agent",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:55:00Z"),
    updated_at: new Date("2025-01-27T10:55:00Z"),
  },
  {
    id: "edge_002",
    source_block_id: "node_001",
    target_block_id: "node_003",
    edge_type: "contains",
    metadata: {
      relationship_type: "workflow_task",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:56:00Z"),
    updated_at: new Date("2025-01-27T10:56:00Z"),
  },
  {
    id: "edge_003",
    source_block_id: "node_005",
    target_block_id: "node_003",
    edge_type: "input",
    metadata: {
      validation_required: true,
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:57:00Z"),
    updated_at: new Date("2025-01-27T10:57:00Z"),
  },
  {
    id: "edge_004",
    source_block_id: "node_006",
    target_block_id: "node_003",
    edge_type: "input",
    metadata: {
      validation_required: true,
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:58:00Z"),
    updated_at: new Date("2025-01-27T10:58:00Z"),
  },
  {
    id: "edge_005",
    source_block_id: "node_003",
    target_block_id: "node_007",
    edge_type: "output",
    metadata: {
      data_format: "json",
      include_metadata: true,
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:59:00Z"),
    updated_at: new Date("2025-01-27T10:59:00Z"),
  },
  // used_by 관계 추가
  {
    id: "edge_006",
    source_block_id: "node_003", // Task (Process CSV Data)
    target_block_id: "node_005", // Artifact Template (Report Template)
    edge_type: "used_by",
    metadata: {
      relationship_type: "task_uses_template",
      usage_context: "report_generation",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:60:00Z"),
    updated_at: new Date("2025-01-27T10:60:00Z"),
  },
  {
    id: "edge_007",
    source_block_id: "node_003", // Task (Process CSV Data)
    target_block_id: "node_006", // Checklist (Data Validation)
    edge_type: "used_by",
    metadata: {
      relationship_type: "task_uses_checklist",
      usage_context: "data_validation",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:61:00Z"),
    updated_at: new Date("2025-01-27T10:61:00Z"),
  },
  {
    id: "edge_008",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_005", // Artifact Template (Report Template)
    edge_type: "used_by",
    metadata: {
      relationship_type: "agent_uses_template",
      usage_context: "report_creation",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:62:00Z"),
    updated_at: new Date("2025-01-27T10:62:00Z"),
  },
  {
    id: "edge_009",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_006", // Checklist (Data Validation)
    edge_type: "used_by",
    metadata: {
      relationship_type: "agent_uses_checklist",
      usage_context: "quality_assurance",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:63:00Z"),
    updated_at: new Date("2025-01-27T10:63:00Z"),
  },
  {
    id: "edge_010",
    source_block_id: "node_003", // Task (Process CSV Data)
    target_block_id: "node_007", // Artifact Class (Report Template Class)
    edge_type: "used_by",
    metadata: {
      relationship_type: "task_uses_artifact_class",
      usage_context: "output_structure",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:64:00Z"),
    updated_at: new Date("2025-01-27T10:64:00Z"),
  },
  {
    id: "edge_011",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_007", // Artifact Class (Report Template Class)
    edge_type: "used_by",
    metadata: {
      relationship_type: "agent_uses_artifact_class",
      usage_context: "output_definition",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:65:00Z"),
    updated_at: new Date("2025-01-27T10:65:00Z"),
  },
  // accesses 관계 추가 - Agent가 리소스에 접근
  {
    id: "edge_012",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_005", // Artifact Template (Report Template)
    edge_type: "accesses",
    metadata: {
      relationship_type: "agent_resource",
      access_level: "read_write",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:66:00Z"),
    updated_at: new Date("2025-01-27T10:66:00Z"),
  },
  {
    id: "edge_013",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_006", // Checklist (Data Validation)
    edge_type: "accesses",
    metadata: {
      relationship_type: "agent_resource",
      access_level: "read_write",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:67:00Z"),
    updated_at: new Date("2025-01-27T10:67:00Z"),
  },
  {
    id: "edge_014",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_007", // Artifact Class (Report Template Class)
    edge_type: "accesses",
    metadata: {
      relationship_type: "agent_resource",
      access_level: "read_write",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:68:00Z"),
    updated_at: new Date("2025-01-27T10:68:00Z"),
  },
  {
    id: "edge_015",
    source_block_id: "node_002", // Agent (Data Analysis Agent)
    target_block_id: "node_008", // Data (Customer Data)
    edge_type: "accesses",
    metadata: {
      relationship_type: "agent_resource",
      access_level: "read_only",
    },
    workspace_id: sampleWorkspace.id,
    created_at: new Date("2025-01-27T10:69:00Z"),
    updated_at: new Date("2025-01-27T10:69:00Z"),
  },
];

/**
 * 전체 목업 데이터를 하나의 객체로 export
 */
export const mockupData = {
  workspace: sampleWorkspace,
  blocks: sampleBlocks,
  blockPositions: sampleBlockPositions,
  edges: sampleEdges,
};
