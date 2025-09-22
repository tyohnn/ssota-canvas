import { ShapePolicy } from "@/domains/blocks/policy/shape-policy";
import type {
  SchemaField,
  FormSchema,
  SchemaFieldType,
} from "@/domains/blocks/types/common.node";
import type { BlockType } from "@/db/schema";
import { createSlug } from "@/lib/regex";

/**
 * Generate default form schema for each node type
 * This schema is used for React Flow nodes but not stored in DB
 */
export function generateDefaultFormSchemaByType(nodeType: BlockType): FormSchema {
  switch (nodeType) {
    case "shape":
      return {
        fields: [
          {
            id: "shape",
            label: "Shape",
            type: "shape",
            path: ["nodeUI", "shape"],
            options: ShapePolicy.getShapeOptions(),
            config: { predefined: true },
          },
          {
            id: "color",
            label: "Color",
            type: "color",
            path: ["nodeUI", "color"],
            options: ShapePolicy.getColorOptions(),
            placeholder: "#F3F4F6",
            validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
            config: { predefined: true },
          },
        ],
      };

    case "text":
      return {
        fields: [
          {
            id: "color",
            label: "Color",
            type: "color",
            path: ["nodeUI", "color"],
            options: ShapePolicy.getColorOptions(),
            placeholder: "#374151",
            validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
            config: { predefined: true },
          },
          {
            id: "textAlign",
            label: "Text Align",
            type: "select",
            path: ["nodeUI", "textAlign"],
            options: [
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ],
            config: { predefined: true },
          },
          {
            id: "richStyle",
            label: "Rich Style",
            type: "checkbox",
            path: ["nodeUI", "richStyle"],
            config: { predefined: true },
          },
        ],
      };

    case "twitter_preview":
      return {
        fields: [
          {
            id: "url",
            label: "Tweet URL",
            type: "url",
            path: ["formData", "url"],
            placeholder: "https://twitter.com/...",
            validation: { required: true },
            config: { predefined: true },
          },
          {
            id: "title",
            label: "Title",
            type: "text",
            path: ["formData", "title"],
            validation: { maxLength: 140 },
            config: { predefined: true },
          },
          {
            id: "description",
            label: "Description",
            type: "text",
            path: ["formData", "description"],
            validation: { maxLength: 280 },
            config: { predefined: true },
          },
        ],
      };

    case "webview":
      return {
        fields: [
          {
            id: "url",
            label: "URL",
            type: "url",
            path: ["formData", "url"],
            placeholder: "https://",
            validation: { required: true },
            config: { predefined: true },
          },
        ],
      };

    case "image":
      return {
        fields: [
          {
            id: "src",
            label: "Image URL",
            type: "url",
            path: ["formData", "src"],
            placeholder: "https://",
            validation: { required: true },
            config: { predefined: true },
          },
          {
            id: "alt",
            label: "Alt Text",
            type: "text",
            path: ["formData", "alt"],
            config: { predefined: true },
          },
        ],
      };

    case "video":
      return {
        fields: [
          {
            id: "src",
            label: "Video URL",
            type: "url",
            path: ["formData", "src"],
            placeholder: "https://",
            validation: { required: true },
            config: { predefined: true },
          },
          {
            id: "autoplay",
            label: "Autoplay",
            type: "checkbox",
            path: ["formData", "autoplay"],
            config: { predefined: true },
          },
          {
            id: "loop",
            label: "Loop",
            type: "checkbox",
            path: ["formData", "loop"],
            config: { predefined: true },
          },
          {
            id: "muted",
            label: "Muted",
            type: "checkbox",
            path: ["formData", "muted"],
            config: { predefined: true },
          },
          {
            id: "controls",
            label: "Show Controls",
            type: "checkbox",
            path: ["formData", "controls"],
            config: { predefined: true },
          },
        ],
      };

    case "math_formula":
      return {
        fields: [
          {
            id: "latex",
            label: "LaTeX",
            type: "text",
            path: ["formData", "latex"],
            placeholder: "e.g., \\int_0^1 x dx",
            validation: { minLength: 1 },
            config: { predefined: true },
          },
          {
            id: "displayMode",
            label: "Display Mode",
            type: "checkbox",
            path: ["formData", "displayMode"],
            config: { predefined: true },
          },
        ],
      };

    case "file":
      return {
        fields: [
          {
            id: "name",
            label: "Name",
            type: "text",
            path: ["formData", "name"],
            validation: { required: true, maxLength: 120 },
            config: { predefined: true },
          },
          {
            id: "url",
            label: "URL",
            type: "url",
            path: ["formData", "url"],
            placeholder: "https://",
            config: { predefined: true },
          },
        ],
      };

    case "youtube":
      return {
        fields: [
          {
            id: "url",
            label: "YouTube URL",
            type: "url",
            path: ["formData", "url"],
            placeholder: "https://www.youtube.com/watch?v=...",
            validation: { required: true },
            config: { predefined: true },
          },
        ],
      };

    case "page":
      return {
        fields: [
          {
            id: "name",
            label: "Page Name",
            type: "text",
            path: ["formData", "name"],
            placeholder: "Enter page name",
            validation: { required: true, minLength: 1, maxLength: 100 },
          },
          {
            id: "description",
            label: "Description",
            type: "text",
            path: ["formData", "description"],
            placeholder: "Enter page description",
            validation: { maxLength: 500 },
          },
          {
            id: "number",
            label: "Number",
            type: "number",
            path: ["formData", "number"],
            validation: { min: 1, max: 999 },
          },
          {
            id: "status",
            label: "Status",
            type: "status",
            path: ["formData", "status"],
            options: [
              { label: "Draft", value: "draft", group: "todo" },
              { label: "In Progress", value: "in_progress", group: "inProgress" },
              { label: "Complete", value: "complete", group: "done" },
            ],
          },
          {
            id: "category",
            label: "Category",
            type: "select",
            path: ["formData", "category"],
            options: [
              { label: "Home", value: "home" },
              { label: "About", value: "about" },
              { label: "Contact", value: "contact" },
              { label: "Services", value: "services" },
              { label: "Blog", value: "blog" },
            ],
          },
          {
            id: "tags",
            label: "Tags",
            type: "multi-select",
            path: ["formData", "tags"],
            options: [
              { label: "Important", value: "important" },
              { label: "Urgent", value: "urgent" },
              { label: "Feature", value: "feature" },
              { label: "Bug", value: "bug" },
              { label: "Enhancement", value: "enhancement" },
            ],
          },
          {
            id: "shape",
            label: "Shape",
            type: "shape",
            path: ["formData", "shape"],
            options: [
              { label: "Rectangle", value: "rect" },
              { label: "Circle", value: "circle" },
              { label: "Diamond", value: "diamond" },
              { label: "Hexagon", value: "hexagon" },
            ],
          },
          {
            id: "color",
            label: "Color",
            type: "color",
            path: ["formData", "color"],
            placeholder: "#F3F4F6",
            validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
          },
          {
            id: "publishDate",
            label: "Publish Date",
            type: "date",
            path: ["formData", "publishDate"],
          },
          {
            id: "isPublished",
            label: "Published",
            type: "checkbox",
            path: ["formData", "isPublished"],
          },
          {
            id: "website",
            label: "Website",
            type: "url",
            path: ["formData", "website"],
            placeholder: "https://example.com",
          },
          {
            id: "document",
            label: "Document",
            type: "file",
            path: ["formData", "document"],
          },
          {
            id: "contactEmail",
            label: "Contact Email",
            type: "email",
            path: ["formData", "contactEmail"],
            placeholder: "contact@example.com",
          },
          {
            id: "contactPhone",
            label: "Contact Phone",
            type: "phone",
            path: ["formData", "contactPhone"],
            placeholder: "010-1234-5678",
          },
          {
            id: "hiddenField",
            label: "Hidden Field",
            type: "hidden",
            path: ["formData", "hiddenField"],
          },
        ],
      };

    default:
      // For unknown types, return empty schema
      return { fields: [] };
  }
}

/**
 * Get default value for each field type
 * Used when adding new fields to provide appropriate initial values
 */
export function getDefaultValueByFieldType(fieldType: SchemaFieldType, options?: Array<{ label: string; value: string }>): any {
  switch (fieldType) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return "";
    
    case "number":
      return 0;
    
    case "checkbox":
      return false;
    
    case "select":
    case "multi-select":
    case "status":
    case "shape":
    case "color":
      // options가 있으면 첫 번째 값, 없으면 빈 문자열
      return options?.[0]?.value || "";
    
    case "date":
      return new Date().toISOString().split('T')[0];
    
    case "file":
      return null;
    
    case "hidden":
      return "";
    
    default:
      return "";
  }
}

// 필드를 속성과 스타일로 분리하는 유틸리티 함수
// path[0]을 기반으로 분리: nodeUI 필드는 styleFields, 나머지는 propertyFields
export function separateFieldsByType(fields: SchemaField[]): {
  propertyFields: SchemaField[];
  styleFields: SchemaField[];
} {
  return {
    propertyFields: fields.filter(field => {
      // path가 없거나 path[0]이 'nodeUI'가 아닌 경우 propertyFields
      if (!field.path || field.path.length === 0) return true;
      return field.path[0] !== 'nodeUI';
    }),
    styleFields: fields.filter(field => {
      // path[0]이 'nodeUI'인 경우 styleFields
      if (!field.path || field.path.length === 0) return false;
      return field.path[0] === 'nodeUI';
    })
  };
}

/**
 * Extract user-defined schema from merged schema (remove default schema)
 * This is the reverse process of mergeFormSchemas
 * Used when creating components to store only user-defined fields
 */
export function extractUserDefinedSchema(
  nodeType: BlockType,
  mergedSchema: FormSchema
): FormSchema {
  const defaultSchema = generateDefaultFormSchemaByType(nodeType);
  const mergedFields = mergedSchema?.fields || [];
  const defaultFields = defaultSchema?.fields || [];
  
  // 기본 스키마의 필드 ID들을 Set으로 관리
  const defaultFieldIds = new Set(defaultFields.map(field => field.id));
  // 기본 스키마에 없는 필드들만 추출 (사용자 정의 필드)
  const userDefinedFields = mergedFields.filter(field => !defaultFieldIds.has(field.id));
  
  return {
    fields: userDefinedFields
  };
}

/**
 * Extract user-defined schema for component instance
 * Removes default schema and component definition schema, keeping only instance-specific fields
 */
export function extractComponentInstanceUserSchema(
  nodeType: BlockType,
  definition: { metadata: { formSchema?: FormSchema } },
  mergedSchema: FormSchema
): FormSchema {
  const defaultSchema = generateDefaultFormSchemaByType(nodeType);
  const definitionSchema = definition.metadata.formSchema || { fields: [] };
  const mergedFields = mergedSchema?.fields || [];
  
  // 기본 스키마와 정의 스키마의 필드 ID들을 Set으로 관리
  const defaultFieldIds = new Set(defaultSchema?.fields?.map(field => field.id) || []);
  const definitionFieldIds = new Set(definitionSchema?.fields?.map(field => field.id) || []);
  
  // 기본 스키마와 정의 스키마에 없는 필드들만 추출 (인스턴스별 사용자 정의 필드)
  const instanceUserFields = mergedFields.filter(field => 
    !defaultFieldIds.has(field.id) && !definitionFieldIds.has(field.id)
  );
  
  return {
    fields: instanceUserFields
  };
}

/**
 * Generate default SchemaField for each field type
 * This provides sensible defaults when adding new properties
 */
export function generateDefaultSchemaFieldByType(
  fieldType: SchemaFieldType,
  label: string,
  pathSection: "nodeUI" | "formData",
  id?: string
): SchemaField {
  const fieldId = id || createSlug(label);
  
  switch (fieldType) {
    case "text":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "text",
        placeholder: `Enter ${label.toLowerCase()}`,
        validation: { minLength: 1, maxLength: 500 },
      };

    case "number":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "number",
        placeholder: `Enter ${label.toLowerCase()}`,
        validation: { min: -999999, max: 999999 },
      };

    case "select":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "select",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" },
        ],
        placeholder: `Select ${label.toLowerCase()}`,
      };

    case "multi-select":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "multi-select",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" },
        ],
        placeholder: `Select ${label.toLowerCase()}`,
      };

    case "status":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "status",
        options: [
          { label: "Draft", value: "draft", color: "gray", group: "todo" },
          { label: "In Progress", value: "in_progress", color: "blue", group: "inProgress" },
          { label: "Complete", value: "complete", color: "green", group: "done" },
        ],
        placeholder: `Select ${label.toLowerCase()}`,
      };

    case "date":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "date",
        placeholder: `Select ${label.toLowerCase()}`,
      };

    case "checkbox":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "checkbox",
      };

    case "url":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "url",
        placeholder: "https://",
        validation: { pattern: "^https?://.+" },
      };

    case "file":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "file",
        placeholder: `Upload ${label.toLowerCase()}`,
      };

    case "email":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "email",
        placeholder: "example@email.com",
        validation: { pattern: "^[^@]+@[^@]+\\.[^@]+$" },
      };

    case "phone":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "phone",
        placeholder: "010-1234-5678",
        validation: { pattern: "^[0-9-+()\\s]+$" },
      };

    case "color":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "color",
        placeholder: "#F3F4F6",
        validation: { pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$" },
      };

    case "shape":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "shape",
        options: [
          { label: "Rectangle", value: "rect" },
          { label: "Circle", value: "circle" },
          { label: "Diamond", value: "diamond" },
          { label: "Hexagon", value: "hexagon" },
        ],
        placeholder: `Select ${label.toLowerCase()}`,
      };

    case "hidden":
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "hidden",
      };

    default:
      return {
        id: fieldId,
        path: [pathSection, fieldId],
        label,
        type: "text",
        placeholder: `Enter ${label.toLowerCase()}`,
      };
  }
}

// export function removeUserSchemaField(
//   node: ReactFlowNode,
//   fieldId: string
// ): { metadata: ReactFlowNodeData } {
//   const nodeData = (node.data || {}) as ReactFlowNodeData;
//   const schema = nodeData.formSchema || { fields: [] };
//   const data = nodeData.formData || {};

//   const target = (schema.fields as SchemaField[]).find((f) => f.id === fieldId);
//   if (target?.config?.predefined) {
//     return { metadata: nodeData }; // do not remove predefined fields
//   }

//   // Remove field from schema
//   const updatedSchema = {
//     ...schema,
//     fields: (schema.fields as SchemaField[]).filter((f) => f.id !== fieldId),
//   };

//   // Remove field value from data
//   const { [fieldId]: removed, ...updatedData } = data;

//   return {
//     metadata: {
//       ...nodeData,
//       formSchema: updatedSchema,
//       formData: updatedData,
//     },
//   };
// }

// export function updateUserSchemaField(
//   node: ReactFlowNode,
//   fieldId: string,
//   updates: Partial<SchemaField>
// ): { metadata: ReactFlowNodeData } {
//   const nodeData = (node.data || {}) as ReactFlowNodeData;
//   const schema = nodeData.formSchema || { fields: [] };
//   const data = nodeData.formData || {};

//   // Update field in schema
//   const updatedSchema = {
//     ...schema,
//     fields: (schema.fields as SchemaField[]).map((f) =>
//       f.id === fieldId ? { ...f, ...updates } : f
//     ),
//   };

//   // Handle field ID change (rename)
//   let updatedData = { ...data };
//   if (updates.id && updates.id !== fieldId) {
//     const { [fieldId]: oldValue, ...rest } = data;
//     updatedData = { ...rest, [updates.id]: oldValue };
//   }

//   return {
//     metadata: {
//       ...nodeData,
//       formSchema: updatedSchema,
//       formData: updatedData,
//     },
//   };
// }
