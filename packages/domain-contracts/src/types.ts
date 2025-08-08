export enum BlockType {
  WORKFLOW = "workflow",
  AGENT = "agent",
  TASK = "task",
  ARTIFACT_TEMPLATE = "artifact_template",
  ARTIFACT_CLASS = "artifact_class",
  DATA = "data",
  CHECKLIST = "checklist",
  BLOCK_DEFINITION = "block_definition",
  EDGE_DEFINITION = "edge_definition",
  COLUMN_DEFINITION = "column_definition",
  START = "start",
  END = "end",
  CONDITION = "condition",
}

export type EdgeType =
  | "contains"
  | "next"
  | "input"
  | "output"
  | "accesses"
  | "used_by";

export interface AgentMetadata {
  name: string;
  slug: string;
  description?: string;
  role: string;
  style?: string;
  identity?: string;
  focus?: string;
  core_principles?: string;
}

export interface TaskMetadata {
  name: string;
  slug: string;
  description?: string;
  instructions: string;
}

export interface WorkflowMetadata {
  name: string;
  slug: string;
  description?: string;
}

export interface DataMetadata {
  name: string;
  slug: string;
  description?: string;
  content: string;
  file?: string;
  filetype?: string;
  filesize?: string;
}

export interface ChecklistMetadata {
  name: string;
  slug: string;
  description?: string;
  instructions: string;
}

export interface ArtifactTemplateMetadata {
  identifier: string;
  displayName: string;
  outputFormat: string;
}

export interface ArtifactClassMetadata {
  identifier: string;
  displayName: string;
  description?: string;
}

export interface StartMetadata {
  position: "entry";
}

export interface EndMetadata {
  position: "exit";
}

export interface ConditionMetadata {
  expression: string;
  operator: string;
}

export interface BlockDefinitionMetadata {}
export interface EdgeDefinitionMetadata {}
export interface ColumnDefinitionMetadata {}

export type BlockMetadata =
  | AgentMetadata
  | TaskMetadata
  | WorkflowMetadata
  | DataMetadata
  | ChecklistMetadata
  | ArtifactTemplateMetadata
  | ArtifactClassMetadata
  | BlockDefinitionMetadata
  | EdgeDefinitionMetadata
  | ColumnDefinitionMetadata
  | StartMetadata
  | EndMetadata
  | ConditionMetadata
  | Record<string, unknown>;

export interface BlockRecord {
  id?: string;
  parent_block_id?: string;
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
  block_type: BlockType;
  slug: string;
  name: string;
  metadata: BlockMetadata;
}

export interface EdgeRecord {
  id?: string;
  edge_type: EdgeType;
  source_block_id: string;
  target_block_id: string;
  metadata?: Record<string, unknown>;
}

export interface BlockRegistry {
  version?: string;
  workspace?: { id?: string; name?: string };
  blocks: BlockRecord[];
  edges?: EdgeRecord[];
}
