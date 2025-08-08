"use client";

import { useState, useCallback } from "react";
import {
  TemplateCreationLogic,
  TemplateCreationInput,
  NodeDefinition,
  EdgeDefinition,
  ColumnDefinition,
} from "../lib/template-creation";

// Template creation state
export interface TemplateCreationState {
  loading: boolean;
  error: string | null;
  validationErrors: string[];
  complexity: "low" | "medium" | "high" | null;
  complexityScore: number | null;
  recommendations: string[];
  lastOperation: "create" | "validate" | "analyze" | null;
}

/**
 * Custom hook for template creation operations
 */
export function useTemplateCreation() {
  const [state, setState] = useState<TemplateCreationState>({
    loading: false,
    error: null,
    validationErrors: [],
    complexity: null,
    complexityScore: null,
    recommendations: [],
    lastOperation: null,
  });

  // Create template with definition management
  const createTemplateWithDefinitions = useCallback(
    async (input: TemplateCreationInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        validationErrors: [],
        complexity: null,
        complexityScore: null,
        recommendations: [],
      }));

      try {
        const result =
          await TemplateCreationLogic.createTemplateWithDefinitions(input);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "create",
          error: result.success
            ? null
            : result.error || "Failed to create template",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create template";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          lastOperation: null,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Validate template creation input
  const validateTemplateCreation = useCallback(
    async (input: TemplateCreationInput) => {
      setState((prev) => ({ ...prev, error: null, validationErrors: [] }));

      try {
        const validation =
          TemplateCreationLogic.validateTemplateCreation(input);

        setState((prev) => ({
          ...prev,
          validationErrors: validation.errors,
          lastOperation: "validate",
        }));

        return validation;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return { valid: false, errors: [errorMessage] };
      }
    },
    []
  );

  // Validate definition relationships
  const validateDefinitionRelationships = useCallback(
    async (definitions: {
      node_definitions?: NodeDefinition[];
      edge_definitions?: EdgeDefinition[];
      column_definitions?: ColumnDefinition[];
    }) => {
      setState((prev) => ({ ...prev, error: null, validationErrors: [] }));

      try {
        const validation =
          TemplateCreationLogic.validateDefinitionRelationships(definitions);

        setState((prev) => ({
          ...prev,
          validationErrors: validation.errors,
          lastOperation: "validate",
        }));

        return validation;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Definition validation failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return { valid: false, errors: [errorMessage] };
      }
    },
    []
  );

  // Analyze template complexity
  const analyzeTemplateComplexity = useCallback(async (templateNode: any) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      complexity: null,
      complexityScore: null,
      recommendations: [],
    }));

    try {
      const result =
        TemplateCreationLogic.analyzeTemplateComplexity(templateNode);

      setState((prev) => ({
        ...prev,
        loading: false,
        lastOperation: "analyze",
        complexity: result.complexity,
        complexityScore: result.score,
        recommendations: result.recommendations,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze template complexity";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastOperation: null,
      }));
      return {
        complexity: "low" as const,
        score: 0,
        recommendations: [errorMessage],
      };
    }
  }, []);

  // Validate template styling
  const validateTemplateStyling = useCallback(async (visualStyle: any) => {
    setState((prev) => ({ ...prev, error: null, validationErrors: [] }));

    try {
      const validation =
        TemplateCreationLogic.validateTemplateStyling(visualStyle);

      setState((prev) => ({
        ...prev,
        validationErrors: validation.errors,
        lastOperation: "validate",
      }));

      return validation;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Styling validation failed";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return { valid: false, errors: [errorMessage] };
    }
  }, []);

  // Generate template slug
  const generateTemplateSlug = useCallback((name: string) => {
    return TemplateCreationLogic.generateTemplateSlug(name);
  }, []);

  // Create default template layout
  const createDefaultLayout = useCallback(() => {
    return TemplateCreationLogic.createDefaultLayout();
  }, []);

  // Create default visual style
  const createDefaultVisualStyle = useCallback(() => {
    return TemplateCreationLogic.createDefaultVisualStyle();
  }, []);

  // Process definitions
  const processDefinitions = useCallback(
    (definitions: {
      node_definitions?: NodeDefinition[];
      edge_definitions?: EdgeDefinition[];
      column_definitions?: ColumnDefinition[];
    }) => {
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
    },
    []
  );

  // Create node definition
  const createNodeDefinition = useCallback(
    (definition: Omit<NodeDefinition, "slug">) => {
      const slug = definition.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      return {
        ...definition,
        slug,
      };
    },
    []
  );

  // Create edge definition
  const createEdgeDefinition = useCallback(
    (definition: Omit<EdgeDefinition, "slug">) => {
      const slug = definition.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      return {
        ...definition,
        slug,
      };
    },
    []
  );

  // Create column definition
  const createColumnDefinition = useCallback(
    (definition: Omit<ColumnDefinition, "slug">) => {
      const slug = definition.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      return {
        ...definition,
        slug,
      };
    },
    []
  );

  // Validate definition slug uniqueness
  const validateDefinitionSlugUniqueness = useCallback(
    (definitions: {
      node_definitions?: NodeDefinition[];
      edge_definitions?: EdgeDefinition[];
      column_definitions?: ColumnDefinition[];
    }) => {
      const allSlugs: string[] = [];
      const errors: string[] = [];

      if (definitions.node_definitions) {
        allSlugs.push(...definitions.node_definitions.map((d) => d.slug));
      }
      if (definitions.edge_definitions) {
        allSlugs.push(...definitions.edge_definitions.map((d) => d.slug));
      }
      if (definitions.column_definitions) {
        allSlugs.push(...definitions.column_definitions.map((d) => d.slug));
      }

      const uniqueSlugs = new Set(allSlugs);
      if (uniqueSlugs.size !== allSlugs.length) {
        errors.push("All definition slugs must be unique");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      validationErrors: [],
      complexity: null,
      complexityScore: null,
      recommendations: [],
    }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      validationErrors: [],
      complexity: null,
      complexityScore: null,
      recommendations: [],
      lastOperation: null,
    });
  }, []);

  return {
    // State
    ...state,

    // Template creation operations
    createTemplateWithDefinitions,
    validateTemplateCreation,
    validateDefinitionRelationships,
    analyzeTemplateComplexity,
    validateTemplateStyling,

    // Utility operations
    generateTemplateSlug,
    createDefaultLayout,
    createDefaultVisualStyle,
    processDefinitions,
    createNodeDefinition,
    createEdgeDefinition,
    createColumnDefinition,
    validateDefinitionSlugUniqueness,
    clearError,
    resetState,
  };
}
