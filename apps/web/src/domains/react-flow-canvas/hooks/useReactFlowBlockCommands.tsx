'use client';

/**
 * Common types and interfaces for React Flow Canvas commands
 */

export type CreateStatus = {
  ok: boolean;
  error?: string;
  data?: any;
};

export type NodePosition = {
  x: number;
  y: number;
};

export type NodeData = {
  name?: string;
  slug?: string;
  nodeUI?: NodeUIData;
  metadata?: any;
  schema?: any;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
};

export type NodeUIData = {
  shape?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  width?: number;
  height?: number;
  [key: string]: any;
};

export type ComponentDefinition = {
  id: string;
  type: 'component-definition';
  position: NodePosition;
  data: NodeData & {
    metadata: {
      role: 'definition';
      schema: any;
      [key: string]: any;
    };
  };
};

export type ComponentInstance = {
  id: string;
  type: 'component-instance';
  position: NodePosition;
  data: NodeData & {
    metadata: {
      role: 'instance';
      component_id: string;
      schema: any;
      [key: string]: any;
    };
  };
};

/**
 * Base hook for React Flow Block Commands
 * This provides common functionality that can be extended by specific command hooks
 */
export function useReactFlowBlockCommands() {
  // This is a base hook that can be extended
  // Specific implementations will be in separate files

  return {
    // Base functionality can be added here
  };
}
