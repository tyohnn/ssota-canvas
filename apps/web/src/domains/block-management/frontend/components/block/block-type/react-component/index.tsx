/**
 * React Component Block Component
 *
 * React 컴포넌트를 실시간으로 미리보기하는 블록 (Sandbox 사용)
 */

'use client';

import React, { memo, useMemo } from 'react';

import type { NodeProps } from '@xyflow/react';
import { Code, Eye, FileText } from 'lucide-react';

import {
  SandboxCodeEditor,
  SandboxConsole,
  SandboxFileExplorer,
  SandboxLayout,
  SandboxPreview,
  SandboxProvider,
  SandboxTabs,
  SandboxTabsContent,
  SandboxTabsList,
  SandboxTabsTrigger,
} from '@workspace/ui/components/kibo-ui/sandbox';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/ui/resizable';

import type { ReactComponentBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ReactComponentBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { BaseBlock } from '../../base-block';

export const ReactComponentBlock = memo(function ReactComponentBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as ReactComponentBlockNodeData;
  const properties = nodeData.properties as ReactComponentBlockProperties;

  // Properties destructuring (사용자가 작성한 코드)
  const {
    code = '',
    template = 'react-ts',
    dependencies,
    files: customFiles,
  } = properties;

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
  const files = useMemo(() => {
    // If customFiles provided, use them
    if (customFiles) {
      console.log(
        '[ReactComponentBlock] Using customFiles:',
        Object.keys(customFiles)
      );
      return customFiles;
    }

    // Otherwise, use legacy single code approach
    console.log('[ReactComponentBlock] Using legacy code approach');
    return {
      '/App.tsx': { code: code || defaultCode },
    };
  }, [code, defaultCode, customFiles]);

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <SandboxProvider
        template={template as any}
        files={files}
        theme="auto"
        customSetup={dependencies ? { dependencies } : undefined}
        options={{
          externalResources: [],
          autorun: true,
          autoReload: true,
          recompileMode: 'immediate',
          recompileDelay: 0,
        }}
      >
        <div
          className="flex flex-col h-full rounded-lg border border-border overflow-hidden bg-background"
          style={{ width, height }}
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
            <SandboxTabsContent
              value="preview"
              className="h-full overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
            >
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={75} minSize={50}>
                  <SandboxLayout>
                    <SandboxPreview
                      showOpenInCodeSandbox={false}
                      showRefreshButton={true}
                    />
                  </SandboxLayout>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <SandboxConsole />
                </ResizablePanel>
              </ResizablePanelGroup>
            </SandboxTabsContent>

            {/* Code Tab */}
            <SandboxTabsContent value="code" className="h-full overflow-hidden">
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <SandboxFileExplorer />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                  <SandboxLayout>
                    <SandboxCodeEditor
                      showTabs={false}
                      showLineNumbers
                      showInlineErrors
                    />
                  </SandboxLayout>
                </ResizablePanel>
              </ResizablePanelGroup>
            </SandboxTabsContent>
          </SandboxTabs>
        </div>
      </SandboxProvider>
    </BaseBlock>
  );
});
