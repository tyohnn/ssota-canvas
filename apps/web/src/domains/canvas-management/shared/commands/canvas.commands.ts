import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

export interface InitializeCanvasCommand {
  pageId: PageId;
  userId: string;
}

export interface LoadCanvasDataCommand {
  pageId: PageId;
  userId: string;
}

export interface GetViewportCommand {
  pageId: PageId;
  userId: string;
}
