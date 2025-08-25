import type { Block } from "@/db/schema";
import { fetchTweetDataAction } from "@/domains/canvas/actions/fetch-tweet";
import { ShapePolicy } from "./shape-policy";
import type {
  DefaultMetadata,
  UserSchema,
  UserSchemaField,
  SchemaField,
  EditorFieldType,
  EditorValidationRules,
} from "./block-rendering-policy";
import {
  isComponentInstance,
  isComponentDefinition,
  type ComponentDefinition,
  type ComponentInstance,
} from "../types/component";
import {
  allowsStyleOverrides,
  getAllowedStyleOverrideFields,
} from "./component-policy";
import { useCanvasData } from "../contexts/CanvasDataContext";

export type EditorField = {
  key: string;
  label: string;
  type: EditorFieldType;
  path: string[];
  options?: { label: string; value: string; color?: string; group?: string }[];
  placeholder?: string;
  validation?: EditorValidationRules;
  config?: { predefined?: boolean; readonly?: boolean };
};

export interface BlockEditorPolicy {
  supports(block: Block): boolean;
  fieldsFor(block: Block): EditorField[];
  onFieldChange?: (args: {
    block: Block;
    field: EditorField;
    value: unknown;
  }) =>
    | Promise<{ metadata?: Record<string, any>; name?: string } | void>
    | { metadata?: Record<string, any>; name?: string }
    | void;
}

// User schema policy that converts user-defined fields to EditorField[]
class UserSchemaPolicy implements BlockEditorPolicy {
  supports(block: Block): boolean {
    const metadata = block.metadata as DefaultMetadata;
    return !!(metadata?.schema?.fields && metadata.schema.fields.length > 0);
  }

  fieldsFor(block: Block): EditorField[] {
    const metadata = block.metadata as DefaultMetadata;
    const schema = metadata?.schema;

    if (!schema?.fields) return [];

    return schema.fields.map((field: SchemaField) => ({
      key: field.id,
      label: field.label,
      type: field.type,
      path:
        field.path && field.path.length > 0 ? field.path : ["data", field.id],
      options: this.mergeOptionsWithPolicy(field),
      placeholder: field.placeholder,
      validation: field.validation,
      config: field.config,
    }));
  }

  /**
   * Merge schema field options with latest policy options for predefined types
   */
  private mergeOptionsWithPolicy(field: SchemaField): any[] | undefined {
    // For shape and color types, always use latest policy options regardless of predefined flag
    switch (field.type) {
      case "shape":
        return ShapePolicy.getShapeOptions();
      case "color":
        return ShapePolicy.getColorOptions();
      default:
        // For predefined fields of other types, use latest policy options
        if (field.config?.predefined) {
          return field.options;
        }
        // For user-defined fields, keep original options
        return field.options;
    }
  }
}

function isType(block: Block, type: string) {
  return (block.block_type as string) === type;
}

class ShapeEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "shape");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "shape",
        label: "Shape",
        type: "shape",
        path: ["node_ui", "shape"],
        options: ShapePolicy.getShapeOptions(),
        config: { predefined: true },
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        path: ["node_ui", "color"],
        options: ShapePolicy.getColorOptions(),
        placeholder: "#F3F4F6",
        validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
        config: { predefined: true },
      },
    ];
  }
}

class BasicTextEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "basic_text");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "color",
        label: "Color",
        type: "color",
        path: ["node_ui", "color"],
        options: ShapePolicy.getColorOptions(),
        placeholder: "#374151",
        validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
        config: { predefined: true },
      },
    ];
  }
}

class TwitterEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "twitter_preview");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "url",
        label: "Tweet URL",
        type: "url",
        path: ["twitter", "url"],
        placeholder: "https://twitter.com/...",
        validation: { required: true },
      },
      {
        key: "title",
        label: "Title",
        type: "text",
        path: ["twitter", "title"],
        validation: { maxLength: 140 },
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        path: ["twitter", "description"],
        validation: { maxLength: 280 },
      },
    ];
  }
  onFieldChange = async ({
    field,
    value,
  }: {
    block: Block;
    field: EditorField;
    value: unknown;
  }) => {
    if (field.key !== "url") return;
    const url = String(value || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) return;
    try {
      const id = (url.match(/\/status\/(\d+)/) || [])[1] || "";
      const td = id ? await fetchTweetDataAction(id) : null;
      return {
        metadata: {
          twitter: {
            url,
            title: td?.authorName ? `Tweet by ${td.authorName}` : "",
            description: td?.text || "",
          },
        },
      } as any;
    } catch (err) {
      return;
    }
  };
}

class WebviewEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "webview");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "url",
        label: "URL",
        type: "url",
        path: ["webview", "url"],
        placeholder: "https://",
        validation: { required: true },
      },
    ];
  }
}

class ImageEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "image");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "src",
        label: "Image URL",
        type: "url",
        path: ["image", "src"],
        placeholder: "https://",
        validation: { required: true },
      },
      { key: "alt", label: "Alt Text", type: "text", path: ["image", "alt"] },
    ];
  }
}

class VideoEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "video");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "src",
        label: "Video URL",
        type: "url",
        path: ["video", "src"],
        placeholder: "https://",
        validation: { required: true },
      },
      {
        key: "autoplay",
        label: "Autoplay",
        type: "checkbox",
        path: ["video", "autoplay"],
      },
      { key: "loop", label: "Loop", type: "checkbox", path: ["video", "loop"] },
      {
        key: "muted",
        label: "Muted",
        type: "checkbox",
        path: ["video", "muted"],
      },
      {
        key: "controls",
        label: "Show Controls",
        type: "checkbox",
        path: ["video", "controls"],
      },
    ];
  }
}

class MathEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return (
      isType(block, "math_formula") || !!(block.metadata as any)?.math?.latex
    );
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "latex",
        label: "LaTeX",
        type: "text",
        path: ["math", "latex"],
        placeholder: "e.g., \\int_0^1 x dx",
        validation: { minLength: 1 },
      },
      {
        key: "displayMode",
        label: "Display Mode",
        type: "checkbox",
        path: ["math", "displayMode"],
      },
    ];
  }
}

class FileEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "file") || !!(block.metadata as any)?.file;
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "name",
        label: "Name",
        type: "text",
        path: ["file", "name"],
        validation: { required: true, maxLength: 120 },
      },
      {
        key: "url",
        label: "URL",
        type: "url",
        path: ["file", "url"],
        placeholder: "https://",
      },
    ];
  }
}

class YoutubeEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "youtube") || !!(block.metadata as any)?.youtube?.url;
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "url",
        label: "YouTube URL",
        type: "url",
        path: ["youtube", "url"],
        placeholder: "https://www.youtube.com/watch?v=...",
        validation: { required: true },
      },
    ];
  }
}

class PageEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isType(block, "page");
  }
  fieldsFor(_block: Block): EditorField[] {
    return [
      {
        key: "name",
        label: "Page Name",
        type: "text",
        path: ["page", "name"],
        placeholder: "Enter page name",
        validation: { required: true, minLength: 1, maxLength: 100 },
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        path: ["page", "description"],
        placeholder: "Enter page description",
        validation: { maxLength: 500 },
      },
      {
        key: "number",
        label: "Number",
        type: "number",
        path: ["page", "number"],
        validation: { min: 1, max: 999 },
      },
      {
        key: "status",
        label: "Status",
        type: "status",
        path: ["page", "status"],
        options: [
          { label: "Draft", value: "draft", group: "todo" },
          { label: "In Progress", value: "in_progress", group: "inProgress" },
          { label: "Complete", value: "complete", group: "done" },
        ],
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        path: ["page", "category"],
        options: [
          { label: "Home", value: "home" },
          { label: "About", value: "about" },
          { label: "Contact", value: "contact" },
          { label: "Services", value: "services" },
          { label: "Blog", value: "blog" },
        ],
      },
      {
        key: "tags",
        label: "Tags",
        type: "multi-select",
        path: ["page", "tags"],
        options: [
          { label: "Important", value: "important" },
          { label: "Urgent", value: "urgent" },
          { label: "Feature", value: "feature" },
          { label: "Bug", value: "bug" },
          { label: "Enhancement", value: "enhancement" },
        ],
      },
      {
        key: "shape",
        label: "Shape",
        type: "shape",
        path: ["page", "shape"],
        options: [
          { label: "Rectangle", value: "rect" },
          { label: "Circle", value: "circle" },
          { label: "Diamond", value: "diamond" },
          { label: "Hexagon", value: "hexagon" },
        ],
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        path: ["page", "color"],
        placeholder: "#F3F4F6",
        validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
      },
      {
        key: "publishDate",
        label: "Publish Date",
        type: "date",
        path: ["page", "publishDate"],
      },
      {
        key: "isPublished",
        label: "Published",
        type: "checkbox",
        path: ["page", "isPublished"],
      },
      {
        key: "website",
        label: "Website",
        type: "url",
        path: ["page", "website"],
        placeholder: "https://example.com",
      },
      {
        key: "document",
        label: "Document",
        type: "file",
        path: ["page", "document"],
      },
      {
        key: "contactEmail",
        label: "Contact Email",
        type: "email",
        path: ["page", "contactEmail"],
        placeholder: "contact@example.com",
      },
      {
        key: "contactPhone",
        label: "Contact Phone",
        type: "phone",
        path: ["page", "contactPhone"],
        placeholder: "010-1234-5678",
      },
      {
        key: "hiddenField",
        label: "Hidden Field",
        type: "hidden",
        path: ["page", "hiddenField"],
      },
    ];
  }
}

// Component Definition Editor Policy
class ComponentDefinitionEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isComponentDefinition(block);
  }

  fieldsFor(block: Block): EditorField[] {
    const definition = block as ComponentDefinition;
    const baseFields: EditorField[] = [
      {
        key: "component_key",
        label: "Component Key",
        type: "hidden", // hidden으로 변경하여 UI에서 숨김
        path: ["component_key"],
        placeholder: "unique-component-key",
        validation: { required: true, pattern: "^[a-z0-9_-]+$" },
        config: { predefined: true },
      },
      {
        key: "component_category",
        label: "Category",
        type: "hidden", // hidden으로 변경하여 UI에서 숨김
        path: ["component_category"],
        options: [
          { label: "Custom", value: "custom" },
          { label: "UI", value: "ui" },
          { label: "Layout", value: "layout" },
          { label: "Content", value: "content" },
          { label: "Media", value: "media" },
        ],
        config: { predefined: true },
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        path: ["description"],
        placeholder: "Describe this component",
        validation: { maxLength: 500 },
        config: { predefined: true },
      },
    ];

    // Add style fields based on the component's base type
    const styleFields = this.getStyleFieldsForType(definition);

    return [...baseFields, ...styleFields];
  }

  private getStyleFieldsForType(
    definition: ComponentDefinition
  ): EditorField[] {
    const baseType = definition.block_type;

    const commonStyleFields: EditorField[] = [
      {
        key: "width",
        label: "Width",
        type: "hidden", // hidden으로 변경하여 UI에서 숨김
        path: ["node_ui", "size", "width"],
        validation: { min: 10, max: 2000 },
        config: { predefined: true },
      },
      {
        key: "height",
        label: "Height",
        type: "hidden", // hidden으로 변경하여 UI에서 숨김
        path: ["node_ui", "size", "height"],
        validation: { min: 10, max: 2000 },
        config: { predefined: true },
      },
    ];

    switch (baseType) {
      case "shape":
        return [
          ...commonStyleFields,
          {
            key: "shape",
            label: "Shape",
            type: "shape",
            path: ["node_ui", "shape"],
            options: ShapePolicy.getShapeOptions(),
            config: { predefined: true },
          },
          {
            key: "color",
            label: "Color",
            type: "color",
            path: ["node_ui", "color"],
            options: ShapePolicy.getColorOptions(),
            config: { predefined: true },
          },
        ];
      case "basic_text":
        return [
          ...commonStyleFields,
          {
            key: "color",
            label: "Color",
            type: "color",
            path: ["node_ui", "color"],
            options: ShapePolicy.getColorOptions(),
            config: { predefined: true },
          },
          {
            key: "weight",
            label: "Font Weight",
            type: "select",
            path: ["node_ui", "weight"],
            options: [
              { label: "Normal", value: "normal" },
              { label: "Bold", value: "bold" },
            ],
            config: { predefined: true },
          },
          {
            key: "fontSize",
            label: "Font Size",
            type: "select",
            path: ["node_ui", "fontSize"],
            options: [
              { label: "24px", value: "24px" },
              { label: "32px", value: "32px" },
              { label: "48px", value: "48px" },
            ],
            config: { predefined: true },
          },
        ];
      default:
        return commonStyleFields;
    }
  }
}

// Component Instance Editor Policy
class ComponentInstanceEditorPolicy implements BlockEditorPolicy {
  supports(block: Block) {
    return isComponentInstance(block);
  }

  fieldsFor(block: Block): EditorField[] {
    const instance = block as ComponentInstance;
    const fields: EditorField[] = [];

    // Add instance data fields from definition schema
    if (instance.metadata.schema?.fields) {
      instance.metadata.schema.fields.forEach((field) => {
        fields.push({
          key: field.id,
          label: field.label,
          type: field.type,
          path: ["data", field.id],
          options: field.options,
          placeholder: field.placeholder,
          validation: field.validation,
          config: field.config,
        });
      });
    }

    // Add style override section if allowed
    // This would need the definition to check if overrides are allowed
    // For now, we'll add a placeholder
    fields.push({
      key: "__style_override_section",
      label: "Style Overrides",
      type: "hidden", // This would be a custom section type
      path: ["__style_overrides"],
      config: { predefined: true },
    });

    return fields;
  }
}

const userSchemaPolicy = new UserSchemaPolicy();

export function resolveEditorPolicy(block: Block): BlockEditorPolicy {
  // Check for component policies first
  if (isComponentDefinition(block)) {
    return new ComponentDefinitionEditorPolicy();
  }

  if (isComponentInstance(block)) {
    return new ComponentInstanceEditorPolicy();
  }

  const blockType = block.block_type as string;

  switch (blockType) {
    case "basic_text":
      return new BasicTextEditorPolicy();
    case "shape":
      return new ShapeEditorPolicy();
    case "twitter_preview":
      return new TwitterEditorPolicy();
    case "webview":
      return new WebviewEditorPolicy();
    case "image":
      return new ImageEditorPolicy();
    case "video":
      return new VideoEditorPolicy();
    case "math_formula":
      return new MathEditorPolicy();
    case "file":
      return new FileEditorPolicy();
    case "youtube":
      return new YoutubeEditorPolicy();
    case "page":
      return new PageEditorPolicy();
    default:
      // Check for metadata-based policies
      if (userSchemaPolicy.supports(block)) {
        return userSchemaPolicy;
      }
      // Fallback to shape editor
      return new BasicTextEditorPolicy();
  }
}

// Convert base (policy) fields into SchemaField[] with predefined=true and path redirected to ["data", id]
export function computePredefinedSchemaFields(block: Block): SchemaField[] {
  const basePolicy = resolveEditorPolicy(block);
  const baseFields = basePolicy.fieldsFor(block);
  return baseFields.map((f) => ({
    id: f.key,
    label: f.label,
    type: f.type,
    options: f.options,
    placeholder: f.placeholder,
    validation: f.validation,
    config: { predefined: true },
    path: f.path,
  }));
}

// Ensure metadata.schema exists and contains all predefined fields; values go under metadata.data
export function ensureSchemaInitialized(block: Block): {
  metadata: DefaultMetadata;
  changed: boolean;
} {
  const metadata = (block.metadata || {}) as DefaultMetadata;
  const schema = metadata.schema || { fields: [] };
  const data = metadata.data || {};
  const predefined = computePredefinedSchemaFields(block);

  const existingById = new Map<string, SchemaField>(
    (schema.fields as SchemaField[]).map((f) => [f.id, f])
  );

  let changed = false;
  const mergedFields: SchemaField[] = [...(schema.fields as SchemaField[])];
  for (const base of predefined) {
    if (!existingById.has(base.id)) {
      mergedFields.push(base);
      changed = true;
    }
  }

  // Add predefined flag to shape and color fields if missing
  const updatedFields = mergedFields.map((field) => {
    if (
      (field.type === "shape" || field.type === "color") &&
      !field.config?.predefined
    ) {
      return {
        ...field,
        config: { ...field.config, predefined: true },
      };
    }
    return field;
  });

  // Sort: predefined fields first, then user-defined fields
  const sortedFields = updatedFields.sort((a, b) => {
    const aPredefined = a.config?.predefined || false;
    const bPredefined = b.config?.predefined || false;
    if (aPredefined && !bPredefined) return -1;
    if (!aPredefined && bPredefined) return 1;
    return 0;
  });

  // Initialize data slots for any missing fields
  const updatedData: Record<string, unknown> = { ...data };
  for (const f of sortedFields) {
    const key = f.id;
    if (!(key in updatedData)) {
      updatedData[key] = null;
      changed = true;
    }
  }

  if (!changed && metadata.schema) {
    return { metadata, changed: false };
  }

  const updated: DefaultMetadata = {
    ...metadata,
    schema: { fields: sortedFields },
    data: updatedData,
  };
  return { metadata: updated, changed: true };
}

// ✅ 인스턴스 필드 값 해석 함수
function getInstanceFieldValue(
  instance: ComponentInstance,
  definition: ComponentDefinition,
  field: SchemaField
): any {
  const fieldPath =
    field.path && field.path.length > 0 ? field.path : ["data", field.id];

  // 1. ✅ 인스턴스에 값이 있으면 사용
  const instanceValue = getNestedValue(instance.metadata.data, fieldPath);
  if (instanceValue !== undefined) return instanceValue;

  // 2. ✅ 정의의 기본값 사용
  const definitionValue = getNestedValue(
    definition.metadata.template_data,
    fieldPath
  );
  if (definitionValue !== undefined) return definitionValue;

  // 3. ✅ 필드의 기본값 사용
  return field.default;
}

// ✅ 중첩 값 가져오기 헬퍼 함수
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}

// ✅ 컴포넌트 정의 가져오기 헬퍼 함수
function getComponentDefinitionById(
  componentId: string
): ComponentDefinition | null {
  // 이 함수는 CanvasDataContext에서 가져와야 하지만,
  // 현재는 간단히 구현하고 나중에 context를 통해 가져오도록 수정
  return null; // TODO: CanvasDataContext에서 가져오기
}

// Merge base policy fields with user schema fields
export function getMergedFields(
  block: Block,
  getComponentDefinition?: (id: string) => ComponentDefinition | null
): EditorField[] {
  // ✅ 컴포넌트 인스턴스 처리
  if (isComponentInstance(block) && getComponentDefinition) {
    const definition = getComponentDefinition(block.metadata.component_id);
    if (!definition) return [];

    // ✅ 정의에서 스키마 가져오기
    const schemaFields = definition.metadata.schema?.fields || [];

    return schemaFields.map((field) => {
      // ✅ Node UI 필드는 override 가능하도록 readonly 설정하지 않음
      const isNodeUIField =
        field.path && field.path.length > 1 && field.path[0] === "node_ui";
      const isReadOnly = !isNodeUIField; // Node UI 필드가 아닌 경우만 읽기 전용

      return {
        key: field.id,
        label: field.label,
        type: field.type,
        path:
          field.path && field.path.length > 0 ? field.path : ["data", field.id],
        options: mergeOptionsWithPolicy(field),
        placeholder: field.placeholder,
        validation: field.validation,
        config: { ...field.config, readonly: isReadOnly },
        // ✅ 인스턴스의 값 또는 정의의 기본값 사용
        value: getInstanceFieldValue(block, definition, field),
      };
    });
  }

  // ✅ 일반 블록은 기존 로직
  // Always ensure schema is initialized (predefined fields injected once)
  const { metadata, changed } = ensureSchemaInitialized(block);
  // We do not persist here; the caller can upsert if needed.
  const schemaFields = metadata.schema?.fields || [];
  if (schemaFields.length > 0) {
    // Render from schema with policy-based option merging
    const fields = schemaFields.map((field: SchemaField) => ({
      key: field.id,
      label: field.label,
      type: field.type,
      path:
        field.path && field.path.length > 0 ? field.path : ["data", field.id],
      options: mergeOptionsWithPolicy(field),
      placeholder: field.placeholder,
      validation: field.validation,
      config: field.config,
    }));

    // Sort: predefined fields first, then user-defined fields
    return fields.sort((a, b) => {
      const aPredefined = a.config?.predefined || false;
      const bPredefined = b.config?.predefined || false;
      if (aPredefined && !bPredefined) return -1;
      if (!aPredefined && bPredefined) return 1;
      return 0;
    });
  }
  return [];
}

// Helper function to merge options with policy (extracted from UserSchemaPolicy)
function mergeOptionsWithPolicy(field: SchemaField): any[] | undefined {
  // For shape and color types, always use latest policy options regardless of predefined flag
  switch (field.type) {
    case "shape":
      return ShapePolicy.getShapeOptions();
    case "color":
      return ShapePolicy.getColorOptions();
    default:
      // For predefined fields of other types, use latest policy options
      if (field.config?.predefined) {
        return field.options;
      }
      // For user-defined fields, keep original options
      return field.options;
  }
}

// User schema management utilities
export function addUserSchemaField(
  block: Block,
  field: SchemaField
): { metadata: DefaultMetadata } {
  const metadata = block.metadata as DefaultMetadata;
  const schema = metadata?.schema || { fields: [] };

  // Add the new field to the schema
  const updatedSchema = {
    ...schema,
    fields: [...schema.fields, field],
  };

  return {
    metadata: {
      ...metadata,
      schema: updatedSchema,
    },
  };
}

// 필드를 속성과 스타일로 분리하는 유틸리티 함수
export function separateFieldsByType(fields: EditorField[]): {
  propertyFields: EditorField[];
  styleFields: EditorField[];
} {
  const styleFieldKeys = ['shape', 'color', 'fontSize', 'weight', 'size'];
  
  return {
    propertyFields: fields.filter(field => !styleFieldKeys.includes(field.key)),
    styleFields: fields.filter(field => styleFieldKeys.includes(field.key))
  };
}

export function removeUserSchemaField(
  block: Block,
  fieldId: string
): { metadata: DefaultMetadata } {
  const metadata = (block.metadata || {}) as DefaultMetadata;
  const schema = metadata.schema || { fields: [] };
  const data = metadata.data || {};

  const target = (schema.fields as SchemaField[]).find((f) => f.id === fieldId);
  if (target?.config?.predefined) {
    return { metadata }; // do not remove predefined fields
  }

  // Remove field from schema
  const updatedSchema = {
    ...schema,
    fields: (schema.fields as SchemaField[]).filter((f) => f.id !== fieldId),
  };

  // Remove field value from data
  const { [fieldId]: removed, ...updatedData } = data;

  return {
    metadata: {
      ...metadata,
      schema: updatedSchema,
      data: updatedData,
    },
  };
}

export function updateUserSchemaField(
  block: Block,
  fieldId: string,
  updates: Partial<SchemaField>
): { metadata: DefaultMetadata } {
  const metadata = (block.metadata || {}) as DefaultMetadata;
  const schema = metadata.schema || { fields: [] };
  const data = metadata.data || {};

  // Update field in schema
  const updatedSchema = {
    ...schema,
    fields: (schema.fields as SchemaField[]).map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    ),
  };

  // Handle field ID change (rename)
  let updatedData = { ...data };
  if (updates.id && updates.id !== fieldId) {
    const { [fieldId]: oldValue, ...rest } = data;
    updatedData = { ...rest, [updates.id]: oldValue };
  }

  return {
    metadata: {
      ...metadata,
      schema: updatedSchema,
      data: updatedData,
    },
  };
}
