'use client';

import React, { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { MarkdownBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block/base-block';
import { useBlockPropertyUpdate } from '../../../hooks/use-block-property-update';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Edit3 } from 'lucide-react';
import { MarkdownBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { cn } from '@/lib/utils';
/**
 * Markdown Block Component
 *
 * BaseBlock을 사용하여 구현된 마크다운 블럭 타입
 * 공통 기능(NodeResizer, Handle, Toolbar)을 BaseBlock에서 제공받음
 */
export const MarkdownBlock = memo(function MarkdownBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  const nodeData = data as MarkdownBlockNodeData;
  const {
    blockMountId,
    blockId,
    blockType,
    size = { width: 300, height: 200 },
    pageId,
    orgId,
    workspaceId,
    properties = {},
  } = nodeData;

  // 노드 크기 설정
  const width = nodeW || size.width;
  const height = nodeH || size.height;
  const markdownBlockProperties = properties as MarkdownBlockProperties;

  const { updateProperty } = useBlockPropertyUpdate();
  const [content, setContent] = useState(markdownBlockProperties.content || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Determine state based on properties content
  const isSkeleton = !content.trim() && !markdownBlockProperties?.title?.trim();

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    await updateProperty(
      blockId,
      'content',
      newContent,
      data as MarkdownBlockNodeData
    );
  };

  const renderSkeletonState = () => (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        Write Markdown
      </h3>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Write rich text content using Markdown
      </p>

      <div className="w-full max-w-2xl">
        <textarea
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          placeholder="# Write your Markdown content here...\n\nUse **bold**, *italic*, and other formatting options."
          className="w-full min-h-[200px] p-4 border rounded-lg font-mono text-sm bg-background"
          aria-label="Markdown editor"
        />
      </div>
    </div>
  );

  const renderCompletedState = () => {
    if (!content.trim()) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No content provided</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Markdown Content
          </h3>
          <div className="flex gap-2">
            <Button
              variant={isPreviewMode ? 'outline' : 'default'}
              size="sm"
              onClick={() => setIsPreviewMode(false)}
              className="h-8"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPreviewMode(true)}
              className="h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="border rounded-lg">
          {isPreviewMode ? (
            <div className="p-4">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: content.replace(/\n/g, '<br>'),
                }}
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              className={cn(
                'w-full min-h-[200px] p-4 border-0 rounded-lg font-mono text-sm bg-background',
                'resize-none focus:outline-none focus:ring-0'
              )}
              aria-label="Markdown editor"
            />
          )}
        </div>

        {/* Content Validation */}
        {content && content.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <FileText className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Markdown may have formatting issues
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
    >
      {/* Markdown Block Content */}
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-2">
          <h3 className="text-sm font-medium text-gray-700">Markdown Block</h3>
        </div>

        {/* Content */}
        <div className="flex-1">
          {isSkeleton ? renderSkeletonState() : renderCompletedState()}
        </div>
      </div>
    </BaseBlock>
  );
});
