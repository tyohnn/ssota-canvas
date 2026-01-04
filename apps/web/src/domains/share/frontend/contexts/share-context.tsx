'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  publishPageAction,
  unpublishPageAction,
  getPublishedPageAction,
  getWorkspaceSelectionAction,
  copyPublishedPageAction,
} from '../../actions/share.actions';
import {
  PublishedPageView,
  PublishResult,
  WorkspaceSelectionView,
  CopyResult,
  PublishPageRequest,
  CopyPublishedPageRequest,
  UnpublishPageRequest,
} from '../../shared/dtos';

interface ShareContextType {
  publishedPage: PublishedPageView | null;
  workspaces: WorkspaceSelectionView['workspaces'];
  isLoading: boolean; // 현재 화면 기준 단일 로딩 상태 (동시 액션은 고려하지 않음)
  error: string | null;

  loadPublishedPage: (token: string) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  publishPage: (request: PublishPageRequest) => Promise<PublishResult>;
  unpublishPage: (request: UnpublishPageRequest) => Promise<void>;
  copyPublishedPage: (request: CopyPublishedPageRequest) => Promise<CopyResult>;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

interface ShareProviderProps {
  children: ReactNode;
  initialPublishedPage?: PublishedPageView | null;
  initialWorkspaces?: WorkspaceSelectionView['workspaces'];
}

export function ShareProvider({
  children,
  initialPublishedPage = null,
  initialWorkspaces = [],
}: ShareProviderProps) {
  const [publishedPage, setPublishedPage] =
    useState<PublishedPageView | null>(initialPublishedPage);
  const [workspaces, setWorkspaces] =
    useState<WorkspaceSelectionView['workspaces']>(initialWorkspaces);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ShareContext는 Share Management Domain 내 UI 상태를 통합 관리하는 Facade Context이다

  const loadPublishedPage = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getPublishedPageAction(token);
      setPublishedPage(data);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load published page');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWorkspaceSelectionAction();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load workspaces');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const publishPage = async (request: PublishPageRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      return await publishPageAction(request);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to publish page');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const unpublishPage = async (request: UnpublishPageRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await unpublishPageAction(request);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to unpublish page');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const copyPublishedPage = async (request: CopyPublishedPageRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      return await copyPublishedPageAction(request);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to copy page');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShareContext.Provider
      value={{
        publishedPage,
        workspaces,
        isLoading,
        error,
        loadPublishedPage,
        loadWorkspaces,
        publishPage,
        unpublishPage,
        copyPublishedPage,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
}

export function useShareContext() {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShareContext must be used within ShareProvider');
  }
  return context;
}
