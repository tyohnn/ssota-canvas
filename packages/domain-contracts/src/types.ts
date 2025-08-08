export type BlockType =
  | "agent"
  | "task"
  | "workflow"
  | "artifact_template"
  | "checklist"
  | "data"
  | "artifact_class";

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

export type BlockMetadata =
  | AgentMetadata
  | TaskMetadata
  | WorkflowMetadata
  | DataMetadata
  | ChecklistMetadata
  | ArtifactTemplateMetadata
  | ArtifactClassMetadata
  | Record<string, unknown>;

export interface BlockRecord {
  id?: string;
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
