import { z } from "zod";
import { createNode } from "../actions/node.action";
import { TemplateMetadata } from "./node-management";

// Definition schemas
const nodeDefinitionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  ai_instruction: z
    .string()
    .min(50, "AI instruction must be at least 50 characters"),
  design_properties: z.record(z.string(), z.any()),
  metadata_schema: z.record(z.string(), z.any()),
});

const edgeDefinitionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  style_properties: z.record(z.string(), z.any()),
  metadata_schema: z.record(z.string(), z.any()),
});

const columnDefinitionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  data_type: z.enum(["string", "number", "boolean", "date", "array", "object"]),
  validation_rules: z.record(z.string(), z.any()),
});

// Template creation input schema
const templateCreationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  artifact_format: z.string().min(1, "Artifact format is required"),
  definitions: z.object({
    node_definitions: z.array(nodeDefinitionSchema).optional(),
    edge_definitions: z.array(edgeDefinitionSchema).optional(),
    column_definitions: z.array(columnDefinitionSchema).optional(),
  }),
  layout: z.record(z.string(), z.any()).optional(),
  visual_style: z.record(z.string(), z.any()).optional(),
});

export type NodeDefinition = z.infer<typeof nodeDefinitionSchema>;
export type EdgeDefinition = z.infer<typeof edgeDefinitionSchema>;
export type ColumnDefinition = z.infer<typeof columnDefinitionSchema>;
export type TemplateCreationInput = z.infer<typeof templateCreationInputSchema>;

/**
 * Template Creation Business Logic Class
 */
export class TemplateCreationLogic {
  /**
   * Validate template creation input
   */
  static validateTemplateCreation(input: TemplateCreationInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Validate basic input
      templateCreationInputSchema.parse(input);

      // Validate that at least one definition type is provided
      const { node_definitions, edge_definitions, column_definitions } =
        input.definitions;
      const totalDefinitions =
        (node_definitions?.length || 0) +
        (edge_definitions?.length || 0) +
        (column_definitions?.length || 0);

      if (totalDefinitions === 0) {
        errors.push("At least one definition must be provided");
      }

      // Validate definition slugs are unique
      const allSlugs: string[] = [];
      if (node_definitions) {
        allSlugs.push(...node_definitions.map((d) => d.slug));
      }
      if (edge_definitions) {
        allSlugs.push(...edge_definitions.map((d) => d.slug));
      }
      if (column_definitions) {
        allSlugs.push(...column_definitions.map((d) => d.slug));
      }

      const uniqueSlugs = new Set(allSlugs);
      if (uniqueSlugs.size !== allSlugs.length) {
        errors.push("All definition slugs must be unique");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e) => e.message));
      } else {
        errors.push("Invalid template creation input");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create template with definition management
   */
  static async createTemplateWithDefinitions(
    input: TemplateCreationInput
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Validate input
      const validation = this.validateTemplateCreation(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `Template validation failed: ${validation.errors.join(", ")}`,
        };
      }

      // Process definitions
      const processedDefinitions = this.processDefinitions(input.definitions);

      // Create template metadata
      const metadata: TemplateMetadata = {
        artifact_format: input.artifact_format,
        definitions: processedDefinitions,
        layout: input.layout || {},
        visual_style: input.visual_style || {},
      };

      // Create template node
      const result = await createNode({
        nodeType: "artifact_template",
        slug: input.slug,
        name: input.name,
        metadata,
        workspaceId: input.workspaceId,
        position: input.position,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create template",
      };
    }
  }

  /**
   * Process definitions and create structured metadata
   */
  private static processDefinitions(
    definitions: TemplateCreationInput["definitions"]
  ): any[] {
    const processedDefinitions: any[] = [];

    // Process node definitions
    if (definitions.node_definitions) {
      definitions.node_definitions.forEach((def) => {
        processedDefinitions.push({
          type: "node_definition",
          ...def,
        });
      });
    }

    // Process edge definitions
    if (definitions.edge_definitions) {
      definitions.edge_definitions.forEach((def) => {
        processedDefinitions.push({
          type: "edge_definition",
          ...def,
        });
      });
    }

    // Process column definitions
    if (definitions.column_definitions) {
      definitions.column_definitions.forEach((def) => {
        processedDefinitions.push({
          type: "column_definition",
          ...def,
        });
      });
    }

    return processedDefinitions;
  }

  /**
   * Validate definition relationships
   */
  static validateDefinitionRelationships(
    definitions: TemplateCreationInput["definitions"]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for circular dependencies in node definitions
    if (definitions.node_definitions) {
      const nodeSlugs = definitions.node_definitions.map((d) => d.slug);
      // This would need more sophisticated dependency analysis
      // For now, just check basic structure
    }

    // Check for valid edge definitions
    if (definitions.edge_definitions) {
      definitions.edge_definitions.forEach((edgeDef) => {
        if (
          !edgeDef.style_properties ||
          Object.keys(edgeDef.style_properties).length === 0
        ) {
          errors.push(
            `Edge definition '${edgeDef.name}' must have style properties`
          );
        }
      });
    }

    // Check for valid column definitions
    if (definitions.column_definitions) {
      definitions.column_definitions.forEach((colDef) => {
        if (
          !colDef.validation_rules ||
          Object.keys(colDef.validation_rules).length === 0
        ) {
          errors.push(
            `Column definition '${colDef.name}' must have validation rules`
          );
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate template slug from name
   */
  static generateTemplateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Create default template layout
   */
  static createDefaultLayout(): any {
    return {
      type: "grid",
      columns: 12,
      rows: "auto",
      gap: 16,
      padding: 24,
      responsive: {
        mobile: {
          columns: 1,
          gap: 8,
          padding: 16,
        },
        tablet: {
          columns: 6,
          gap: 12,
          padding: 20,
        },
      },
    };
  }

  /**
   * Create default visual style
   */
  static createDefaultVisualStyle(): any {
    return {
      theme: "light",
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        accent: "#f59e0b",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#1e293b",
        border: "#e2e8f0",
      },
      typography: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: {
          small: "0.875rem",
          base: "1rem",
          large: "1.125rem",
          xlarge: "1.25rem",
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      shadows: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      },
    };
  }

  /**
   * Validate template styling
   */
  static validateTemplateStyling(visualStyle: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for required color properties
    const requiredColors = ["primary", "background", "text"];
    requiredColors.forEach((color) => {
      if (!visualStyle.colors?.[color]) {
        errors.push(`Missing required color: ${color}`);
      }
    });

    // Check for valid color values
    if (visualStyle.colors) {
      Object.entries(visualStyle.colors).forEach(([key, value]) => {
        if (typeof value !== "string" || !value.match(/^#[0-9a-f]{6}$/i)) {
          errors.push(`Invalid color value for ${key}: ${value}`);
        }
      });
    }

    // Check for valid typography
    if (visualStyle.typography) {
      if (!visualStyle.typography.fontFamily) {
        errors.push("Font family is required");
      }
      if (!visualStyle.typography.fontSize?.base) {
        errors.push("Base font size is required");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Analyze template complexity
   */
  static analyzeTemplateComplexity(templateNode: any): {
    complexity: "low" | "medium" | "high";
    score: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 0;

    const metadata = templateNode.metadata;
    if (!metadata) {
      return {
        complexity: "low",
        score: 0,
        recommendations: ["Template has no metadata"],
      };
    }

    // Analyze definitions count
    const definitions = metadata.definitions || [];
    const definitionCount = definitions.length;

    if (definitionCount > 10) {
      score += 3;
      recommendations.push(
        "Consider splitting template into smaller components"
      );
    } else if (definitionCount > 5) {
      score += 2;
    } else {
      score += 1;
    }

    // Analyze definition types
    const nodeDefs = definitions.filter(
      (d: any) => d.type === "node_definition"
    ).length;
    const edgeDefs = definitions.filter(
      (d: any) => d.type === "edge_definition"
    ).length;
    const columnDefs = definitions.filter(
      (d: any) => d.type === "column_definition"
    ).length;

    if (nodeDefs > 5) {
      score += 2;
      recommendations.push(
        "High number of node definitions may impact performance"
      );
    }

    if (edgeDefs > 3) {
      score += 1;
    }

    if (columnDefs > 8) {
      score += 2;
      recommendations.push(
        "Consider using a data table component for many columns"
      );
    }

    // Analyze styling complexity
    const visualStyle = metadata.visual_style || {};
    const colorCount = Object.keys(visualStyle.colors || {}).length;
    const hasCustomTypography =
      visualStyle.typography && Object.keys(visualStyle.typography).length > 2;

    if (colorCount > 8) {
      score += 1;
      recommendations.push("Consider simplifying color palette");
    }

    if (hasCustomTypography) {
      score += 1;
    }

    // Determine complexity level
    let complexity: "low" | "medium" | "high";
    if (score <= 3) {
      complexity = "low";
    } else if (score <= 6) {
      complexity = "medium";
    } else {
      complexity = "high";
    }

    return {
      complexity,
      score,
      recommendations,
    };
  }
}
