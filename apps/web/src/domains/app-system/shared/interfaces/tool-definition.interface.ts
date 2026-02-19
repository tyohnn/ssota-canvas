/**
 * Tool definition for Block Tools and App Tools.
 * Used by the agent dispatcher and tool execution.
 */

export interface IToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  executionSide: 'server' | 'client';
}
