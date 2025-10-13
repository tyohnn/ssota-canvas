'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Folder } from 'lucide-react';
import { Input } from '@workspace/ui/components/ui/input';
import type {
  PageTreeNodeDTO,
  WorkspaceWithPagesDTO,
} from '../../../shared/dtos';
import { useWorkspace } from '../../hooks/use-workspace';
import { WorkspaceIcon } from '../shared/icon-picker';

interface PageHeaderProps {
  page: PageTreeNodeDTO;
  workspace: WorkspaceWithPagesDTO | null;
}

/**
 * Page Header
 *
 * 페이지 상단 헤더 (제목, 아이콘, 메타 정보)
 * - 제목 클릭 시 인라인 편집
 * - 아이콘 클릭 시 IconPicker 표시
 */
export function PageHeader({ page, workspace }: PageHeaderProps) {
  const { updatePageInfo } = useWorkspace();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // 제목 편집 모드 활성화 시 input에 포커스
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  // 제목 저장
  const handleSaveTitle = async () => {
    if (editingTitle.trim() === '' || editingTitle === page.title) {
      setIsEditingTitle(false);
      setEditingTitle(page.title);
      return;
    }

    const success = await updatePageInfo(page.id, editingTitle);
    if (success) {
      setIsEditingTitle(false);
    } else {
      setEditingTitle(page.title); // 실패 시 원래 값으로 복원
    }
  };

  return (
    <div className="border-b px-8 py-4">
      <div className="max-w-4xl mx-auto space-y-1">
        {/* 페이지 제목 */}
        <div className="flex items-center gap-3">
          {/* 아이콘 (향후 IconPicker로 변경 가능) */}
          <div className="h-12 w-12 flex items-center justify-center">
            <WorkspaceIcon
              icon={page.icon || 'FileText'}
              size={32}
              className="text-muted-foreground"
            />
          </div>

          {/* 제목 (클릭하여 편집) */}
          {isEditingTitle ? (
            <Input
              ref={inputRef}
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSaveTitle();
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setEditingTitle(page.title);
                }
              }}
              className="text-3xl font-bold h-12 border-none shadow-none focus-visible:ring-0 px-2"
              maxLength={200}
            />
          ) : (
            <h1
              className="text-3xl font-bold cursor-text hover:bg-accent/50 px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {page.title}
            </h1>
          )}
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
