"use client";

import { useState, useCallback } from "react";
import {
  AgentCreationLogic,
  NaturalLanguageInput,
  AgentCreationInput,
} from "../lib/agent-creation";

// Agent creation state
export interface AgentCreationState {
  loading: boolean;
  error: string | null;
  processing: boolean;
  validationErrors: string[];
  effectiveness: number | null;
  recommendations: string[];
  lastOperation: "create" | "update" | "analyze" | null;
}

/**
 * Custom hook for agent creation operations
 */
export function useAgentCreation() {
  const [state, setState] = useState<AgentCreationState>({
    loading: false,
    error: null,
    processing: false,
    validationErrors: [],
    effectiveness: null,
    recommendations: [],
    lastOperation: null,
  });

  // Process natural language input
  const processNaturalLanguageInput = useCallback(
    async (input: NaturalLanguageInput) => {
      setState((prev) => ({
        ...prev,
        processing: true,
        error: null,
        validationErrors: [],
        effectiveness: null,
        recommendations: [],
      }));

      try {
        const result = AgentCreationLogic.processNaturalLanguageInput(input);

        setState((prev) => ({
          ...prev,
          processing: false,
          error: result.success
            ? null
            : result.error || "Failed to process natural language input",
          lastOperation: null,
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process natural language input";
        setState((prev) => ({
          ...prev,
          processing: false,
          error: errorMessage,
          lastOperation: null,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Create agent with natural language processing
  const createAgentWithNaturalLanguage = useCallback(
    async (input: AgentCreationInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        validationErrors: [],
        effectiveness: null,
        recommendations: [],
      }));

      try {
        const result =
          await AgentCreationLogic.createAgentWithNaturalLanguage(input);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "create",
          error: result.success
            ? null
            : result.error || "Failed to create agent",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create agent";
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

  // Update agent with natural language processing
  const updateAgentWithNaturalLanguage = useCallback(
    async (nodeId: string, naturalLanguageInput: NaturalLanguageInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        validationErrors: [],
        effectiveness: null,
        recommendations: [],
      }));

      try {
        const result = await AgentCreationLogic.updateAgentWithNaturalLanguage(
          nodeId,
          naturalLanguageInput
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "update",
          error: result.success
            ? null
            : result.error || "Failed to update agent",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update agent";
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

  // Analyze agent effectiveness
  const analyzeAgentEffectiveness = useCallback(async (agentNode: any) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      effectiveness: null,
      recommendations: [],
    }));

    try {
      const result = AgentCreationLogic.analyzeAgentEffectiveness(agentNode);

      setState((prev) => ({
        ...prev,
        loading: false,
        lastOperation: "analyze",
        effectiveness: result.effectiveness,
        recommendations: result.recommendations,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze agent effectiveness";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastOperation: null,
      }));
      return {
        effectiveness: 0,
        recommendations: [errorMessage],
      };
    }
  }, []);

  // Validate agent metadata
  const validateAgentMetadata = useCallback(async (metadata: any) => {
    setState((prev) => ({ ...prev, error: null, validationErrors: [] }));

    try {
      const validation = AgentCreationLogic.validateAgentMetadata(metadata);

      setState((prev) => ({
        ...prev,
        validationErrors: validation.errors,
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
  }, []);

  // Generate agent slug
  const generateAgentSlug = useCallback((identifier: string) => {
    return AgentCreationLogic.generateAgentSlug(identifier);
  }, []);

  // Extract capabilities from text
  const extractCapabilities = useCallback((persona: string, role: string) => {
    // This would be a public method if we expose it from AgentCreationLogic
    const text = `${persona} ${role}`.toLowerCase();
    const capabilities: string[] = [];

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
  }, []);

  // Extract tools from text
  const extractTools = useCallback((persona: string, role: string) => {
    const text = `${persona} ${role}`.toLowerCase();
    const tools: string[] = [];

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
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      validationErrors: [],
      effectiveness: null,
      recommendations: [],
    }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      processing: false,
      validationErrors: [],
      effectiveness: null,
      recommendations: [],
      lastOperation: null,
    });
  }, []);

  return {
    // State
    ...state,

    // Agent creation operations
    processNaturalLanguageInput,
    createAgentWithNaturalLanguage,
    updateAgentWithNaturalLanguage,
    analyzeAgentEffectiveness,

    // Validation operations
    validateAgentMetadata,

    // Utility operations
    generateAgentSlug,
    extractCapabilities,
    extractTools,
    clearError,
    resetState,
  };
}
