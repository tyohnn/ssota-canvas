export interface CreateChatSessionParams {
  workspaceId: string;
  userId: string;
}

export interface UpdateChatSessionTitleParams {
  sessionId: string;
  userId: string;
  title: string;
}

export interface SaveChatSessionMessagesParams {
  sessionId: string;
  userId: string;
  appendMessages: unknown[];
}

export interface ListChatSessionsParams {
  workspaceId: string;
  userId: string;
}

export interface GetChatSessionParams {
  sessionId: string;
  userId: string;
}

export interface DeleteChatSessionParams {
  sessionId: string;
  userId: string;
}
