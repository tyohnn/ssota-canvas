/**
 * React Preview Block Component
 *
 * React 컴포넌트를 실시간으로 미리보기하는 블록 (Sandbox 사용)
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ReactPreviewBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block';
import {
  SandboxProvider,
  SandboxLayout,
  SandboxTabs,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTabsContent,
  SandboxCodeEditor,
  SandboxPreview,
} from '@workspace/ui/components/kibo-ui/sandbox';
import { Code, Eye } from 'lucide-react';
import { ReactPreviewBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

export const ReactPreviewBlock = memo(function ReactPreviewBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as ReactPreviewBlockNodeData;
  const properties = nodeData.properties as ReactPreviewBlockProperties;

  // Properties destructuring (사용자가 작성한 코드)
  const { code = '' } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 500;
  const height = typeof nodeH === 'number' ? nodeH : 400;

  // Default code
  const defaultCode = `export default function App() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: '#6366f1',
        fontSize: '2rem',
        marginBottom: '1rem'
      }}>
        Hello SSOTA!
      </h1>
      <p style={{ color: '#666' }}>
        React components live in canvas
      </p>
    </div>
  );
}`;

  // Sandbox files structure
  const files = useMemo(
    () => ({
      '/App.tsx': { code: code || defaultCode },
    }),
    [code, defaultCode]
  );

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <div
        className="flex flex-col h-full rounded-lg border border-border overflow-hidden bg-background"
        style={{ width, height }}
      >
        <SandboxProvider
          template="react-ts"
          files={files}
          theme="auto"
          options={{
            externalResources: [],
            autorun: true,
            autoReload: true,
          }}
        >
          <SandboxTabs defaultValue="preview" className="h-full border-0">
            {/* Tabs List */}
            <SandboxTabsList className="border-b">
              <SandboxTabsTrigger value="preview">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </SandboxTabsTrigger>
              <SandboxTabsTrigger value="code">
                <Code className="h-3.5 w-3.5" />
                Code
              </SandboxTabsTrigger>
            </SandboxTabsList>

            {/* Preview Tab */}
            <SandboxTabsContent value="preview" className="h-full">
              <SandboxLayout>
                <SandboxPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                />
              </SandboxLayout>
            </SandboxTabsContent>

            {/* Code Tab */}
            <SandboxTabsContent value="code" className="h-full">
              <SandboxLayout>
                <SandboxCodeEditor
                  showTabs={false}
                  showLineNumbers
                  showInlineErrors
                />
              </SandboxLayout>
            </SandboxTabsContent>
          </SandboxTabs>
        </SandboxProvider>
      </div>
    </BaseBlock>
  );
});
