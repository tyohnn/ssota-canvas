import { ComponentType } from "react";
import { z } from "zod";
import {
  PageBlockType,
  BlockType,
  AgentMetadata,
  TaskMetadata,
  WorkflowMetadata,
  DataMetadata,
  ChecklistMetadata,
  ArtifactTemplateMetadata,
  ArtifactClassMetadata,
  BlockMetadata,
} from "./block-definition-policy";
import {
  AgentMetadataSchema,
  TaskMetadataSchema,
  WorkflowMetadataSchema,
  DataMetadataSchema,
  ChecklistMetadataSchema,
} from "@/domains/workflow-canvas/contracts";

/**
 * 🎯 EDITOR RENDERING POLICY
 * ============================
 *
 * 📋 파일 역할:
 * - 블록 타입별 에디터 패널 렌더링 전략 구현
 * - 블록 메타데이터 스키마에 따른 폼 구성 정의
 * - 탭 기반 인터페이스 및 필드 검증 규칙 관리
 * - Strategy Pattern을 사용한 확장 가능한 에디터 시스템
 *
 * 🔧 주요 기능:
 * - 블록별 에디터 렌더링 전략 (AgentEditorStrategy, TaskEditorStrategy 등)
 * - 필드 정의 및 검증 규칙
 * - 탭 구성 및 폼 레이아웃
 * - 연결된 블록 시각화 설정
 *
 * 📦 Export:
 * - EditorRenderingStrategy 인터페이스
 * - 7개 블록 에디터 전략 클래스들
 * - EditorRenderingStrategyFactory
 */

/**
 * 필드 타입 정의
 */
export type FieldType =
  | "text"
  | "textarea"
  | "textarea-single"
  | "textarea-multi"
  | "select"
  | "checkbox"
  | "number"
  | "hidden";

/**
 * 필드 검증 규칙
 */
export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean | string;
}

/**
 * 에디터 필드 정의
 */
export interface EditorField {
  id: string;
  label: string;
  description?: string;
  type: FieldType;
  placeholder?: string;
  validation: FieldValidation;
  defaultValue?: string;
  options?: { value: string; label: string }[]; // select 타입용
}

/**
 * 폼 그룹 정의 (이전 탭 개념을 그룹으로 변경)
 */
export interface FormGroup {
  id: string;
  label: string;
  description?: string;
  icon?: ComponentType;
  fields: EditorField[];
}

/**
 * 연결된 블록 시각화 설정
 */
export interface ConnectionVisualization {
  showConnectedBlocks: boolean;
  connectionTypes: string[]; // "contains", "input", "output", "next", "accesses" 등
  renderMode: "hierarchy" | "flow" | "network" | "none";
  maxDepth?: number;
}

/**
 * 블록 타입 문자열 정의
 */
export type EditorBlockType =
  | "workflow"
  | "agent"
  | "task"
  | "artifact_template"
  | "artifact_class"
  | "data"
  | "checklist"
  | "start"
  | "end"
  | "conditional"
  | "condition";

/**
 * 에디터 렌더링 설정 (configuration 탭 전용)
 */
export interface EditorConfig {
  blockType: EditorBlockType;
  title: string;
  description?: string;
  layout: "groups" | "single" | "accordion";
  formGroups: FormGroup[]; // 이전 tabs → formGroups
  connectionVisualization: ConnectionVisualization;
  specialTools?: string[]; // 특별한 도구들 (workflow 블록의 start/end/branch 등)
}

/**
 * 에디터 렌더링 전략 인터페이스
 */
export interface EditorRenderingStrategy<
  T extends BlockMetadata = BlockMetadata,
> {
  /**
   * 블록 타입에 대한 에디터 설정을 반환
   */
  getEditorConfig(): EditorConfig;

  /**
   * Zod 스키마를 반환
   */
  getZodSchema(): z.ZodSchema<any>;

  /**
   * 블록 메타데이터를 검증
   */
  validateMetadata(metadata: T): {
    isValid: boolean;
    errors: Record<string, string>;
  };

  /**
   * 기본 메타데이터 값을 생성
   */
  getDefaultMetadata(): T;
}

// Zod Schemas - 인터페이스에 맞게 정의
export const agentSchema: z.ZodSchema<AgentMetadata> = z.object({
  name: z
    .string()
    .min(2, "Agent name must be at least 2 characters")
    .max(100, "Agent name must be less than 100 characters"),
  slug: z.string(), // Auto-generated, but required for form
  description: z
    .string()
    .max(200, "Agent description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  role: z
    .string()
    .min(10, "Agent role must be at least 10 characters")
    .max(200, "Agent role must be less than 200 characters"),
  style: z
    .string()
    .max(200, "Style must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  identity: z
    .string()
    .max(200, "Identity must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  focus: z
    .string()
    .max(200, "Focus must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  core_principles: z
    .string()
    .max(1000, "Core principles must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const taskSchema: z.ZodSchema<TaskMetadata> = z.object({
  name: z
    .string()
    .min(1, "Task name is required")
    .max(100, "Task name must be less than 100 characters"),
  slug: z.string(),
  description: z
    .string()
    .max(200, "Task description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  instructions: z
    .string()
    .min(10, "Task instructions must be at least 10 characters"),
});

export const workflowSchema: z.ZodSchema<WorkflowMetadata> = z.object({
  name: z
    .string()
    .min(1, "Workflow name is required")
    .max(100, "Workflow name must be less than 100 characters"),
  slug: z.string(),
  description: z
    .string()
    .max(200, "Workflow description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
});

export const dataSchema: z.ZodSchema<DataMetadata> = z.object({
  name: z
    .string()
    .min(1, "Data name is required")
    .max(100, "Data name must be less than 100 characters"),
  slug: z.string(),
  description: z
    .string()
    .max(200, "Data description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  content: z.string().min(10, "Data content must be at least 10 characters"),
  file: z.string().optional().or(z.literal("")),
  filetype: z.string().optional().or(z.literal("")),
  filesize: z.string().optional().or(z.literal("")),
});

export const checklistSchema: z.ZodSchema<ChecklistMetadata> = z.object({
  name: z
    .string()
    .min(1, "Checklist name is required")
    .max(100, "Checklist name must be less than 100 characters"),
  slug: z.string(),
  description: z
    .string()
    .max(200, "Checklist description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  instructions: z
    .string()
    .min(10, "Checklist instructions must be at least 10 characters"),
});

// Placeholder schemas for future implementation
export const artifactTemplateSchema: z.ZodSchema<ArtifactTemplateMetadata> =
  z.object({
    identifier: z.string(),
    displayName: z.string(),
    outputFormat: z.string(),
  });

export const artifactClassSchema: z.ZodSchema<ArtifactClassMetadata> = z.object(
  {
    identifier: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
  }
);

/**
 * 1. 에이전트 블록 에디터 전략
 */
export class AgentEditorRenderingStrategy
  implements EditorRenderingStrategy<AgentMetadata>
{
  getZodSchema() {
    return AgentMetadataSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "agent",
      title: "Agent Configuration",
      description: "Define AI agent persona and characteristics",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          description: "Basic identification and description",
          fields: [
            {
              id: "name",
              label: "Agent Name",
              description: "Name we use when communicating with this agent",
              type: "text",
              placeholder: "e.g., System Architect Alex",
              validation: {
                required: true,
                minLength: 2,
                maxLength: 100,
              },
            },
            {
              id: "slug",
              label: "Agent Slug",
              description: "Programmatic identifier (auto-generated)",
              type: "hidden",
              placeholder: "auto-generated",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              description: "Brief description of this agent's purpose",
              type: "textarea-single",
              placeholder: "Brief description of what this agent does...",
              validation: { required: false, maxLength: 200 },
            },
          ],
        },
        {
          id: "configuration",
          label: "Persona Configuration",
          description: "Define agent personality, role, and characteristics",
          fields: [
            {
              id: "role",
              label: "Role",
              description: "Position and responsibilities within company/team",
              type: "textarea-single",
              placeholder: "e.g., Senior Full-Stack Developer & Technical Lead",
              validation: {
                required: true,
                minLength: 10,
                maxLength: 200,
              },
            },
            {
              id: "style",
              label: "Style",
              description: "Thinking and working style characteristics",
              type: "textarea-single",
              placeholder: "e.g., Analytical, collaborative, detail-oriented",
              validation: {
                required: false,
                maxLength: 200,
              },
            },
            {
              id: "identity",
              label: "Identity",
              description: "Core identity and professional characteristics",
              type: "textarea-single",
              placeholder:
                "e.g., Problem solver who bridges technical and business needs",
              validation: {
                required: false,
                maxLength: 200,
              },
            },
            {
              id: "focus",
              label: "Focus",
              description: "Key points and priorities to concentrate on",
              type: "textarea-single",
              placeholder:
                "e.g., System architecture, performance optimization",
              validation: {
                required: false,
                maxLength: 200,
              },
            },
            {
              id: "core_principles",
              label: "Core Principles",
              description: "Detailed thought processes and guiding principles",
              type: "textarea-multi",
              placeholder: "Enter core principles and guiding values...",
              validation: {
                required: false,
              },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["contains", "accesses"],
        renderMode: "hierarchy",
        maxDepth: 2,
      },
    };
  }

  validateMetadata(metadata: AgentMetadata) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!metadata.name || metadata.name.trim().length < 2) {
      errors.name = "Agent name must be at least 2 characters";
    }
    if (metadata.name && metadata.name.length > 100) {
      errors.name = "Agent name must be less than 100 characters";
    }

    // Role validation
    if (!metadata.role || metadata.role.trim().length < 10) {
      errors.role = "Agent role must be at least 10 characters";
    }
    if (metadata.role && metadata.role.length > 200) {
      errors.role = "Agent role must be less than 200 characters";
    }

    // Optional fields length validation
    if (metadata.style && metadata.style.length > 200) {
      errors.style = "Style must be less than 200 characters";
    }
    if (metadata.identity && metadata.identity.length > 200) {
      errors.identity = "Identity must be less than 200 characters";
    }
    if (metadata.focus && metadata.focus.length > 200) {
      errors.focus = "Focus must be less than 200 characters";
    }

    // Core principles validation (no format restrictions)
    if (metadata.core_principles && metadata.core_principles.length > 1000) {
      errors.core_principles =
        "Core principles must be less than 1000 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  getDefaultMetadata(): AgentMetadata {
    return {
      name: "",
      slug: "",
      description: "",
      role: "",
      style: "",
      identity: "",
      focus: "",
      core_principles: "",
    };
  }
}

/**
 * 2. 태스크 블록 에디터 전략
 */
export class TaskEditorRenderingStrategy
  implements EditorRenderingStrategy<TaskMetadata>
{
  getZodSchema() {
    return TaskMetadataSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "task",
      title: "Task Configuration",
      description: "Define task instructions and parameters",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          description: "Basic identification and description",
          fields: [
            {
              id: "name",
              label: "Task Name",
              description: "Human-readable label that appears in the interface",
              type: "text",
              placeholder: "e.g., Data Processing Task",
              validation: { required: true, minLength: 1, maxLength: 100 },
            },
            {
              id: "slug",
              label: "Task Slug",
              description: "Programmatic identifier (auto-generated)",
              type: "hidden",
              placeholder: "auto-generated",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              description: "Human-readable explanation of the task purpose",
              type: "textarea-single",
              placeholder: "Brief description of what this task does...",
              validation: { required: false, maxLength: 200 },
            },
          ],
        },
        {
          id: "configuration",
          label: "Task Configuration",
          description: "Define detailed instructions and execution parameters",
          fields: [
            {
              id: "instructions",
              label: "Instructions",
              description:
                "Detailed step-by-step instructions for the agent to follow",
              type: "textarea-multi",
              placeholder: "Enter detailed instructions for the agent...",
              validation: { required: true, minLength: 10 },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["input", "output", "contains"],
        renderMode: "flow",
      },
    };
  }

  validateMetadata(metadata: TaskMetadata) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!metadata.name || metadata.name.trim().length < 1) {
      errors.name = "Task name is required";
    }
    if (metadata.name && metadata.name.length > 100) {
      errors.name = "Task name must be less than 100 characters";
    }

    // Slug validation
    if (!metadata.slug || metadata.slug.trim().length < 1) {
      errors.slug = "Task slug is required";
    }

    // Instructions validation
    if (!metadata.instructions || metadata.instructions.trim().length < 10) {
      errors.instructions = "Task instructions must be at least 10 characters";
    }

    // Description validation
    if (metadata.description && metadata.description.length > 200) {
      errors.description = "Task description must be less than 200 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  getDefaultMetadata(): TaskMetadata {
    return {
      name: "",
      slug: "",
      description: "",
      instructions: "",
    };
  }
}

/**
 * 3. 워크플로우 블록 에디터 전략
 */
export class WorkflowEditorRenderingStrategy
  implements EditorRenderingStrategy<WorkflowMetadata>
{
  getZodSchema() {
    return WorkflowMetadataSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "workflow",
      title: "Workflow Configuration",
      description: "Define workflow process and control flow",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          fields: [
            {
              id: "name",
              label: "Workflow Name",
              description: "Human-readable label that appears in the interface",
              type: "text",
              placeholder: "e.g., Customer Onboarding Workflow",
              validation: { required: true, minLength: 1, maxLength: 100 },
            },
            {
              id: "slug",
              label: "Workflow Slug",
              description: "Programmatic identifier (auto-generated)",
              type: "text",
              placeholder: "auto-generated",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              description: "Human-readable explanation of the workflow purpose",
              type: "textarea-single",
              placeholder: "Brief description of what this workflow does...",
              validation: { required: false, maxLength: 200 },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["next", "contains"],
        renderMode: "flow",
      },
      specialTools: ["start", "end", "branch", "condition"],
    };
  }

  validateMetadata(metadata: WorkflowMetadata) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!metadata.name || metadata.name.trim().length < 1) {
      errors.name = "Workflow name is required";
    }
    if (metadata.name && metadata.name.length > 100) {
      errors.name = "Workflow name must be less than 100 characters";
    }

    // Slug validation
    if (!metadata.slug || metadata.slug.trim().length < 1) {
      errors.slug = "Workflow slug is required";
    }

    // Description validation
    if (metadata.description && metadata.description.length > 200) {
      errors.description =
        "Workflow description must be less than 200 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  getDefaultMetadata(): WorkflowMetadata {
    return {
      name: "",
      slug: "",
      description: "",
    };
  }
}

/**
 * 4. 아티팩트 템플릿 블록 에디터 전략 (향후 구현)
 */
export class ArtifactTemplateEditorRenderingStrategy
  implements EditorRenderingStrategy<ArtifactTemplateMetadata>
{
  getZodSchema() {
    return artifactTemplateSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "artifact_template",
      title: "Template Configuration",
      description: "Define output structure and format",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          fields: [
            {
              id: "identifier",
              label: "Template Identifier",
              type: "text",
              validation: { required: true },
            },
            {
              id: "outputFormat",
              label: "Output Format",
              type: "select",
              options: [
                { value: "visual_flow", label: "Visual Flow" },
                { value: "text_document", label: "Text Document" },
                { value: "data_table", label: "Data Table" },
                { value: "custom", label: "Custom Format" },
              ],
              validation: { required: true },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["contains", "used_by"],
        renderMode: "hierarchy",
      },
      specialTools: [
        "block-designer",
        "connection-designer",
        "column-designer",
      ],
    };
  }

  validateMetadata(metadata: ArtifactTemplateMetadata) {
    // 향후 구현
    return { isValid: true, errors: {} };
  }

  getDefaultMetadata(): ArtifactTemplateMetadata {
    return {
      identifier: "",
      displayName: "",
      outputFormat: "visual_flow",
    };
  }
}

/**
 * 5. 데이터 블록 에디터 전략
 */
export class DataEditorRenderingStrategy
  implements EditorRenderingStrategy<DataMetadata>
{
  getZodSchema() {
    return DataMetadataSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "data",
      title: "Data Configuration",
      description: "Define data source and content",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          fields: [
            {
              id: "name",
              label: "Data Name",
              description: "Human-readable label that appears in the interface",
              type: "text",
              placeholder: "e.g., Customer Database",
              validation: { required: true, minLength: 1, maxLength: 100 },
            },
            {
              id: "slug",
              label: "Data Slug",
              description: "Programmatic identifier (auto-generated)",
              type: "text",
              placeholder: "auto-generated",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              description:
                "Human-readable explanation of the data source purpose",
              type: "textarea-single",
              placeholder: "Brief description of this data source...",
              validation: { required: false, maxLength: 200 },
            },
          ],
        },
        {
          id: "content",
          label: "Content",
          fields: [
            {
              id: "content",
              label: "Data Content",
              description:
                "The actual information, documentation, or reference material",
              type: "textarea-multi",
              placeholder:
                "Enter data content, documentation, or reference material...",
              validation: { required: true, minLength: 10 },
            },
          ],
        },
        {
          id: "file",
          label: "File Upload",
          description: "Upload file as data source (future enhancement)",
          fields: [
            {
              id: "file",
              label: "File",
              description: "Upload a file to use as data source",
              type: "text", // Placeholder for file upload
              placeholder: "File upload not yet implemented",
              validation: { required: false },
            },
            {
              id: "filetype",
              label: "File Type",
              description: "Automatically extracted file type",
              type: "text",
              placeholder: "Not available",
              validation: { required: false },
            },
            {
              id: "filesize",
              label: "File Size",
              description: "Automatically extracted file size",
              type: "text",
              placeholder: "Not available",
              validation: { required: false },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["used_by"],
        renderMode: "network",
      },
    };
  }

  validateMetadata(metadata: DataMetadata) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!metadata.name || metadata.name.trim().length < 1) {
      errors.name = "Data name is required";
    }
    if (metadata.name && metadata.name.length > 100) {
      errors.name = "Data name must be less than 100 characters";
    }

    // Slug validation
    if (!metadata.slug || metadata.slug.trim().length < 1) {
      errors.slug = "Data slug is required";
    }

    // Content validation
    if (!metadata.content || metadata.content.trim().length < 10) {
      errors.content = "Data content must be at least 10 characters";
    }

    // Description validation
    if (metadata.description && metadata.description.length > 200) {
      errors.description = "Data description must be less than 200 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  getDefaultMetadata(): DataMetadata {
    return {
      name: "",
      slug: "",
      description: "",
      content: "",
      file: "",
      filetype: "",
      filesize: "",
    };
  }
}

/**
 * 6. 체크리스트 블록 에디터 전략
 */
export class ChecklistEditorRenderingStrategy
  implements EditorRenderingStrategy<ChecklistMetadata>
{
  getZodSchema() {
    return ChecklistMetadataSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "checklist",
      title: "Checklist Configuration",
      description: "Define quality assurance checklist",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          fields: [
            {
              id: "name",
              label: "Checklist Name",
              description: "Human-readable label that appears in the interface",
              type: "text",
              placeholder: "e.g., Quality Assurance Checklist",
              validation: { required: true, minLength: 1, maxLength: 100 },
            },
            {
              id: "slug",
              label: "Checklist Slug",
              description: "Programmatic identifier (auto-generated)",
              type: "text",
              placeholder: "auto-generated",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              description:
                "Human-readable explanation of the checklist purpose",
              type: "textarea-single",
              placeholder:
                "Brief description of what this checklist validates...",
              validation: { required: false, maxLength: 200 },
            },
          ],
        },
        {
          id: "content",
          label: "Content",
          fields: [
            {
              id: "instructions",
              label: "Checklist Instructions",
              description: "Detailed list of items to check or validate",
              type: "textarea-multi",
              placeholder: "Enter checklist items and validation criteria...",
              validation: { required: true, minLength: 10 },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: false,
        connectionTypes: [],
        renderMode: "none",
      },
    };
  }

  validateMetadata(metadata: ChecklistMetadata) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!metadata.name || metadata.name.trim().length < 1) {
      errors.name = "Checklist name is required";
    }
    if (metadata.name && metadata.name.length > 100) {
      errors.name = "Checklist name must be less than 100 characters";
    }

    // Slug validation
    if (!metadata.slug || metadata.slug.trim().length < 1) {
      errors.slug = "Checklist slug is required";
    }

    // Instructions validation
    if (!metadata.instructions || metadata.instructions.trim().length < 10) {
      errors.instructions =
        "Checklist instructions must be at least 10 characters";
    }

    // Description validation
    if (metadata.description && metadata.description.length > 200) {
      errors.description =
        "Checklist description must be less than 200 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  getDefaultMetadata(): ChecklistMetadata {
    return {
      name: "",
      slug: "",
      description: "",
      instructions: "",
    };
  }
}

/**
 * 7. 아티팩트 클래스 블록 에디터 전략 (향후 구현)
 */
export class ArtifactClassEditorRenderingStrategy
  implements EditorRenderingStrategy<ArtifactClassMetadata>
{
  getZodSchema() {
    return artifactClassSchema;
  }

  getEditorConfig(): EditorConfig {
    return {
      blockType: "artifact_class",
      title: "Artifact Class Configuration",
      description: "Define structured artifact class",
      layout: "groups",
      formGroups: [
        {
          id: "basic",
          label: "Basic Info",
          fields: [
            {
              id: "identifier",
              label: "Class Identifier",
              type: "text",
              validation: { required: true },
            },
            {
              id: "description",
              label: "Description",
              type: "textarea-multi",
              validation: { required: false },
            },
          ],
        },
      ],
      connectionVisualization: {
        showConnectedBlocks: true,
        connectionTypes: ["used_by"],
        renderMode: "network",
      },
    };
  }

  validateMetadata(metadata: ArtifactClassMetadata) {
    // 향후 구현
    return { isValid: true, errors: {} };
  }

  getDefaultMetadata(): ArtifactClassMetadata {
    return {
      identifier: "",
      displayName: "",
      description: "",
    };
  }
}

/**
 * 팩토리 클래스: 블록 타입에 따라 적절한 에디터 전략을 반환
 */
export class EditorRenderingStrategyFactory {
  static getStrategy(
    blockType: EditorBlockType
  ): EditorRenderingStrategy<BlockMetadata> {
    switch (blockType) {
      case "agent":
        return new AgentEditorRenderingStrategy();
      case "task":
        return new TaskEditorRenderingStrategy();
      case "workflow":
        return new WorkflowEditorRenderingStrategy();
      case "artifact_template":
        return new ArtifactTemplateEditorRenderingStrategy();
      case "data":
        return new DataEditorRenderingStrategy();
      case "checklist":
        return new ChecklistEditorRenderingStrategy();
      case "artifact_class":
        return new ArtifactClassEditorRenderingStrategy();
      default:
        throw new Error(`Unknown block type for editor: ${blockType}`);
    }
  }

  /**
   * 모든 사용 가능한 블록 타입 목록 반환
   */
  static getSupportedBlockTypes(): EditorBlockType[] {
    return [
      "agent",
      "task",
      "workflow",
      "artifact_template",
      "data",
      "checklist",
      "artifact_class",
    ];
  }

  /**
   * 블록 타입별 빠른 검증
   */
  static validateBlockMetadata<T extends BlockMetadata>(
    blockType: EditorBlockType,
    metadata: T
  ) {
    const strategy = this.getStrategy(blockType);
    return strategy.validateMetadata(metadata);
  }

  /**
   * 블록 타입별 기본 메타데이터 생성
   */
  static getDefaultBlockMetadata(blockType: EditorBlockType): BlockMetadata {
    const strategy = this.getStrategy(blockType);
    return strategy.getDefaultMetadata();
  }

  /**
   * 블록 타입별 Zod 스키마 가져오기
   */
  static getZodSchema(blockType: EditorBlockType) {
    const strategy = this.getStrategy(blockType);
    return strategy.getZodSchema();
  }
}
