import { z } from "zod";
import { createBlock } from "../actions/block.action";
import { AgentMetadata } from "./node-management";

// Natural language input schema
const naturalLanguageInputSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  displayName: z.string().min(1, "Display name is required"),
  persona: z.string().min(50, "Persona must be at least 50 characters"),
  role: z.string().min(30, "Role must be at least 30 characters"),
});

// Agent creation input schema
const agentCreationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
  naturalLanguageInput: naturalLanguageInputSchema,
});

export type NaturalLanguageInput = z.infer<typeof naturalLanguageInputSchema>;
export type AgentCreationInput = z.infer<typeof agentCreationInputSchema>;

/**
 * Agent Creation Business Logic Class
 */
export class AgentCreationLogic {
  /**
   * Process natural language input and extract structured metadata
   */
  static processNaturalLanguageInput(input: NaturalLanguageInput): {
    success: boolean;
    data?: AgentMetadata;
    error?: string;
  } {
    try {
      // Validate input
      naturalLanguageInputSchema.parse(input);

      // Extract and structure metadata
      const metadata: AgentMetadata = {
        persona: input.persona,
        role: input.role,
        capabilities: this.extractCapabilities(input.persona, input.role),
        tools: this.extractTools(input.persona, input.role),
      };

      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process natural language input",
      };
    }
  }

  /**
   * Extract capabilities from persona and role descriptions
   */
  private static extractCapabilities(persona: string, role: string): string[] {
    const capabilities: string[] = [];
    const text = `${persona} ${role}`.toLowerCase();

    // Extract capabilities based on keywords
    if (text.includes("analyze") || text.includes("analysis")) {
      capabilities.push("data_analysis");
    }
    if (
      text.includes("code") ||
      text.includes("programming") ||
      text.includes("develop")
    ) {
      capabilities.push("coding");
    }
    if (text.includes("design") || text.includes("ui") || text.includes("ux")) {
      capabilities.push("design");
    }
    if (
      text.includes("test") ||
      text.includes("qa") ||
      text.includes("quality")
    ) {
      capabilities.push("testing");
    }
    if (
      text.includes("manage") ||
      text.includes("coordinate") ||
      text.includes("lead")
    ) {
      capabilities.push("management");
    }
    if (text.includes("research") || text.includes("investigate")) {
      capabilities.push("research");
    }
    if (
      text.includes("write") ||
      text.includes("document") ||
      text.includes("content")
    ) {
      capabilities.push("content_creation");
    }

    return capabilities;
  }

  /**
   * Extract tools from persona and role descriptions
   */
  private static extractTools(persona: string, role: string): string[] {
    const tools: string[] = [];
    const text = `${persona} ${role}`.toLowerCase();

    // Extract tools based on keywords
    if (text.includes("code") || text.includes("programming")) {
      tools.push("code_editor", "git", "terminal");
    }
    if (text.includes("design") || text.includes("ui")) {
      tools.push("figma", "sketch", "design_system");
    }
    if (text.includes("test") || text.includes("qa")) {
      tools.push("testing_framework", "bug_tracker", "test_automation");
    }
    if (text.includes("analyze") || text.includes("data")) {
      tools.push("data_analysis_tools", "spreadsheet", "visualization");
    }
    if (text.includes("manage") || text.includes("project")) {
      tools.push("project_management", "task_tracker", "communication");
    }

    return tools;
  }

  /**
   * Generate agent slug from identifier
   */
  static generateAgentSlug(identifier: string): string {
    return identifier
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Validate agent metadata
   */
  static validateAgentMetadata(metadata: AgentMetadata): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!metadata.persona || metadata.persona.length < 50) {
      errors.push("Persona must be at least 50 characters");
    }

    if (!metadata.role || metadata.role.length < 30) {
      errors.push("Role must be at least 30 characters");
    }

    if (!metadata.capabilities || metadata.capabilities.length === 0) {
      errors.push("At least one capability must be specified");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create agent with natural language processing
   */
  static async createAgentWithNaturalLanguage(
    input: AgentCreationInput
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Validate input
      agentCreationInputSchema.parse(input);

      // Process natural language input
      const processedInput = this.processNaturalLanguageInput(
        input.naturalLanguageInput
      );
      if (!processedInput.success || !processedInput.data) {
        return {
          success: false,
          error:
            processedInput.error || "Failed to process natural language input",
        };
      }

      // Validate agent metadata
      const validation = this.validateAgentMetadata(processedInput.data);
      if (!validation.valid) {
        return {
          success: false,
          error: `Agent validation failed: ${validation.errors.join(", ")}`,
        };
      }

      // Generate slug
      const slug = this.generateAgentSlug(
        input.naturalLanguageInput.identifier
      );

      // Create agent node
      const result = await createBlock({
        blockType: "agent",
        slug,
        name: input.naturalLanguageInput.displayName,
        metadata: processedInput.data,
        workspaceId: input.workspaceId,
        position: input.position,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create agent",
      };
    }
  }

  /**
   * Update agent with natural language processing
   */
  static async updateAgentWithNaturalLanguage(
    nodeId: string,
    naturalLanguageInput: NaturalLanguageInput
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Process natural language input
      const processedInput =
        this.processNaturalLanguageInput(naturalLanguageInput);
      if (!processedInput.success || !processedInput.data) {
        return {
          success: false,
          error:
            processedInput.error || "Failed to process natural language input",
        };
      }

      // Validate agent metadata
      const validation = this.validateAgentMetadata(processedInput.data);
      if (!validation.valid) {
        return {
          success: false,
          error: `Agent validation failed: ${validation.errors.join(", ")}`,
        };
      }

      // Generate new slug
      const slug = this.generateAgentSlug(naturalLanguageInput.identifier);

      // Update agent node (this would need to be implemented in node actions)
      // For now, return success with processed data
      return {
        success: true,
        data: {
          nodeId,
          slug,
          name: naturalLanguageInput.displayName,
          metadata: processedInput.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update agent",
      };
    }
  }

  /**
   * Analyze agent effectiveness based on usage patterns
   */
  static analyzeAgentEffectiveness(agentNode: any): {
    effectiveness: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let effectiveness = 0.5; // Base effectiveness

    // Analyze persona completeness
    if (agentNode.metadata?.persona) {
      const personaLength = agentNode.metadata.persona.length;
      if (personaLength > 200) {
        effectiveness += 0.2;
      } else if (personaLength < 100) {
        effectiveness -= 0.1;
        recommendations.push(
          "Expand persona description for better agent performance"
        );
      }
    }

    // Analyze role clarity
    if (agentNode.metadata?.role) {
      const roleLength = agentNode.metadata.role.length;
      if (roleLength > 100) {
        effectiveness += 0.15;
      } else if (roleLength < 50) {
        effectiveness -= 0.1;
        recommendations.push("Provide more detailed role description");
      }
    }

    // Analyze capabilities
    if (agentNode.metadata?.capabilities) {
      const capabilityCount = agentNode.metadata.capabilities.length;
      if (capabilityCount > 3) {
        effectiveness += 0.1;
      } else if (capabilityCount < 2) {
        effectiveness -= 0.1;
        recommendations.push("Add more specific capabilities");
      }
    }

    // Analyze tools
    if (agentNode.metadata?.tools) {
      const toolCount = agentNode.metadata.tools.length;
      if (toolCount > 2) {
        effectiveness += 0.05;
      }
    }

    // Clamp effectiveness between 0 and 1
    effectiveness = Math.max(0, Math.min(1, effectiveness));

    return {
      effectiveness,
      recommendations,
    };
  }
}
