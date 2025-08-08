import { z } from "zod";
import { SLUG_RE } from "./constants.js";

export const AgentMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG_RE),
  description: z.string().optional(),
  role: z.string().min(1),
  style: z.string().optional(),
  identity: z.string().optional(),
  focus: z.string().optional(),
  core_principles: z.string().optional(),
});

export const TaskMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG_RE),
  description: z.string().optional(),
  instructions: z.string().min(1),
});

export const WorkflowMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG_RE),
  description: z.string().optional(),
});

export const DataMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG_RE),
  description: z.string().optional(),
  content: z.string().default(""),
  file: z.string().optional(),
  filetype: z.string().optional(),
  filesize: z.string().optional(),
});

export const ChecklistMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG_RE),
  description: z.string().optional(),
  instructions: z.string().min(1),
});

export const ArtifactTemplateMetadataSchema = z.object({
  identifier: z.string(),
  displayName: z.string(),
  outputFormat: z.string(),
});

export const ArtifactClassMetadataSchema = z.object({
  identifier: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
});

export const BlockRecordSchema = z.object({
  id: z.uuid().optional(),
  block_type: z.enum([
    "agent",
    "task",
    "workflow",
    "artifact_template",
    "checklist",
    "data",
    "artifact_class",
  ] as const),
  slug: z.string().regex(SLUG_RE),
  name: z.string().min(1),
  metadata: z.union([
    AgentMetadataSchema,
    TaskMetadataSchema,
    WorkflowMetadataSchema,
    DataMetadataSchema,
    ChecklistMetadataSchema,
    ArtifactTemplateMetadataSchema,
    ArtifactClassMetadataSchema,
    z.record(z.string(), z.unknown()),
  ]),
});

export const EdgeRecordSchema = z.object({
  id: z.uuid().optional(),
  edge_type: z.enum([
    "contains",
    "next",
    "input",
    "output",
    "accesses",
    "used_by",
  ] as const),
  source_block_id: z.uuid(),
  target_block_id: z.uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const BlockRegistrySchema = z.object({
  version: z.string().optional(),
  workspace: z
    .object({ id: z.uuid().optional(), name: z.string().optional() })
    .optional(),
  blocks: z.array(BlockRecordSchema),
  edges: z.array(EdgeRecordSchema).optional(),
});

export type Infer<T extends z.ZodTypeAny> = z.infer<T>;
