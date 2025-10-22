export interface BlockDTO {
  id: string;
  blockType: string;
  workspaceId: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockRequest {
  blockType: string;
  workspaceId: string;
  metadata?: Record<string, any>;
}
