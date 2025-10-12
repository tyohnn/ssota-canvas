'use client';

import React from 'react';
import { FileText, Folder } from 'lucide-react';
import type {
  PageTreeNodeDTO,
  WorkspaceWithPagesDTO,
} from '../../../shared/dtos';

interface PageHeaderProps {
  page: PageTreeNodeDTO;
  workspace: WorkspaceWithPagesDTO | null;
}

/**
 * Page Header
 *
 * 페이지 상단 헤더 (제목, 아이콘, 메타 정보)
 */
export function PageHeader({ page, workspace }: PageHeaderProps) {
  return (
    <div className="border-b px-8 py-4">
      <div className="max-w-4xl mx-auto space-y-1">
        {/* 페이지 제목 */}
        <div className="flex items-center gap-3">
          {page.icon ? (
            <span className="text-3xl">{page.icon}</span>
          ) : (
            <FileText className="h-8 w-8 text-muted-foreground" />
          )}
          <h1 className="text-3xl font-bold">{page.title}</h1>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {workspace && (
            <>
              {workspace.icon ? (
                <span className="text-base">{workspace.icon}</span>
              ) : (
                <Folder className="h-4 w-4" />
              )}
              <span>{workspace.name}</span>
              <span>•</span>
            </>
          )}
          <span>
            Last modified:{' '}
            {new Date(page.lastModified).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
