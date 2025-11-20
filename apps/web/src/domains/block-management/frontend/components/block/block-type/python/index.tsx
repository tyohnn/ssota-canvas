'use client';

import React, { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { PythonBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block/base-block';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { Button } from '@/components/ui/button';
import { Play, FileCode, AlertCircle } from 'lucide-react';
import { PythonBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { cn } from '@/lib/utils';

/**
 * Python Block Component
 *
 * BaseBlock을 사용하여 구현된 파이썬 블럭 타입
 * 공통 기능(NodeResizer, Handle, Toolbar)을 BaseBlock에서 제공받음
 */
export const PythonBlock = memo(function PythonBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  const nodeData = data as PythonBlockNodeData;
  const {
    blockMountId,
    blockId,
    blockType,
    size = { width: 350, height: 250 },
    pageId,
    orgId,
    workspaceId,
    properties = {},
  } = nodeData;

  // 노드 크기 설정
  const width = nodeW || size.width;
  const height = nodeH || size.height;
  const pythonBlockProperties = properties as PythonBlockProperties;

  const { updateProperty } = useBlockPropertyUpdate();
  const [code, setCode] = useState(pythonBlockProperties.code || '');
  const [output, setOutput] = useState(pythonBlockProperties.output || '');
  const [isRunning, setIsRunning] = useState(false);

  // Determine state based on properties content
  const isSkeleton = !code.trim();

  const handleCodeChange = async (newCode: string) => {
    setCode(newCode);
    await updateProperty(blockId, 'code', newCode, data as PythonBlockNodeData);
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    try {
      // In a real implementation, this would call a Python execution service
      const mockOutput = `Output: ${code}`;
      setOutput(mockOutput);
      await updateProperty(
        blockId,
        'output',
        mockOutput,
        data as PythonBlockNodeData
      );
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderSkeletonState = () => (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
      <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        Write Python Code
      </h3>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Write and execute Python code
      </p>

      <div className="w-full max-w-2xl">
        <textarea
          value={code}
          onChange={e => handleCodeChange(e.target.value)}
          placeholder="# Write your Python code here..."
          className="w-full min-h-[200px] p-4 border rounded-lg font-mono text-sm bg-background"
          aria-label="Python code editor"
        />
      </div>
    </div>
  );

  const renderCompletedState = () => {
    if (!code.trim()) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <FileCode className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No code provided</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Python Code
            </h3>
            <Button
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              size="sm"
              className="h-8"
            >
              <Play className="h-3 w-3 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>

          <div className="relative">
            <textarea
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              className={cn(
                'w-full min-h-[200px] p-4 border rounded-lg font-mono text-sm bg-background',
                'python-code resize-none focus:outline-none focus:ring-2 focus:ring-primary'
              )}
              aria-label="Python code editor"
            />

            {/* Syntax highlighting overlay */}
            <div className="absolute top-4 left-4 pointer-events-none text-sm font-mono text-muted-foreground/50">
              {code.split('\n').map((line, index) => (
                <div key={index} className="h-5">
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Output */}
        {output && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Output
            </h4>
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        )}

        {/* Dependencies - 임시로 제거 */}

        {/* Code Validation */}
        {code && code.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Code may have syntax errors
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
      {/* Python Block Content */}
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-2">
          <h3 className="text-sm font-medium text-gray-700">Python Block</h3>
        </div>

        {/* Content */}
        <div className="flex-1">
          {isSkeleton ? renderSkeletonState() : renderCompletedState()}
        </div>
      </div>
    </BaseBlock>
  );
});
