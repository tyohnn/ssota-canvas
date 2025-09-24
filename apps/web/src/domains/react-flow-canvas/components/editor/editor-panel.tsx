'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Block } from '@/db/schema';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Badge } from '@workspace/ui/components/ui/badge';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import { useReactFlowCommandsContext } from '@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext';
import { PropertySection } from './property-section';
import { StyleSection } from './style-section';
import {
  Expand,
  Share2,
  MoreHorizontal,
  ChevronsRight,
  Component,
  Unlink,
} from 'lucide-react';
import { usePanel } from '@/domains/react-flow-canvas/contexts/PanelContext';
import {
  useReactFlowSelectionCommands,
  useReactFlowNodeSelection,
} from '@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext';
import { ComponentInstanceData } from '@/domains/block-components/types/component.types';
import { FormSchema, SchemaField } from '@/domains/blocks/types/common.node';
import { OverrideFlags } from '@/domains/block-components/types/component-override.types';
import { separateFieldsByType } from '../../policy/node-form-schema-policy';

interface EditorPanelProps {
  className?: string;
}

export interface ComponentInfo {
  type: 'instance' | 'definition';
  definitionId: string;
  definition: Block | undefined;
  overrides?: OverrideFlags;
  instanceId?: string;
}

/**
 * Editor Panel - positioned relative to ResizablePanel
 * Notion-like interface with StyleSection and PropertySection
 */
export function EditorPanel({ className }: EditorPanelProps) {
  // from canvas domain
  const data = useCanvasData();
  const { canvasMode, selectComponent } = data;

  // from react-flow-canvas domain
  const panel = usePanel();
  const selectionCommands = useReactFlowSelectionCommands();
  const { selectedSingleNodeData } = useReactFlowNodeSelection();
  const { nodeCommands } = useReactFlowCommandsContext();

  // editor panel state
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const componentInfo: ComponentInfo | null = useMemo(() => {
    if (!selectedSingleNodeData) return null;

    const nodeData = selectedSingleNodeData.data;
    if (!nodeData) return null;

    const isNodeInstance = Boolean(nodeData.instanceData);
    const isNodeDefinition =
      nodeData.object === 'component' && Boolean(nodeData.componentData);

    // React Flow 노드 데이터에서 컴포넌트 정보 확인
    if (isNodeInstance) {
      const definitionId = (nodeData.instanceData as ComponentInstanceData)
        .componentId;
      const definition = data.getComponentBlockById(definitionId);
      const overrides = (nodeData.instanceData as ComponentInstanceData)
        .overrides;

      return {
        type: 'instance' as const,
        definitionId,
        definition,
        overrides,
        instanceId: selectedSingleNodeData.id,
      };
    }

    if (isNodeDefinition) {
      const definition = data.getComponentBlockById(selectedSingleNodeData.id);
      return {
        type: 'definition' as const,
        definitionId: selectedSingleNodeData.id,
        definition,
      };
    }

    return null;
  }, [selectedSingleNodeData]);

  const fields = useMemo<{
    styleFields: SchemaField[];
    propertyFields: SchemaField[];
  }>(() => {
    const formSchema = selectedSingleNodeData?.data.formSchema as FormSchema;

    // formSchema가 없거나 fields가 없으면 빈 배열 반환
    if (!formSchema || !formSchema.fields) {
      return { styleFields: [], propertyFields: [] };
    }

    const visibleFields = formSchema.fields.filter(
      field => field.type !== 'hidden'
    );

    // 스타일 필드만 추출
    const { styleFields, propertyFields } = separateFieldsByType(visibleFields);

    return { styleFields, propertyFields };
  }, [selectedSingleNodeData]);

  // 제목 상태 동기화 - React Flow 노드 ID 사용
  useEffect(() => {
    if (selectedSingleNodeData) {
      setTitle(selectedSingleNodeData.data.title as string);
    }
  }, [selectedSingleNodeData]);

  // 편집 완료
  const handleTitleSave = async () => {
    if (selectedSingleNodeData && title.trim()) {
      const newTitle = title.trim();

      const result = await nodeCommands.updateNodeData(selectedSingleNodeData, {
        title: newTitle,
      });

      if (!result.ok) {
        console.error('Failed to update block:', result.error);
        // Reset title to original value on error
        setTitle(`Node ${selectedSingleNodeData.id.slice(0, 8)}`);
      }
    }
  };

  // Enter 키로 저장
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(selectedSingleNodeData?.data.title as string);
    }
  };

  // 포커스 아웃 시 저장
  const handleBlur = () => {
    handleTitleSave();
  };

  useEffect(() => {
    if (panel.showEditorPanel) {
      // Show: Start rendering and trigger slide-in animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Hide: Start slide-out animation
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [panel.showEditorPanel]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[45%] h-[90%] bg-background/70 backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${className || ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95 group"
              onClick={panel.closeEditorPanel}
            >
              <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('Expand modal');
              }}
            >
              <Expand className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('Share');
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('More options');
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Title Section */}
          <div className="p-4">
            {/* Component Info */}
            {componentInfo && (
              <div className="mb-3 space-y-2">
                {componentInfo.type === 'instance' && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      <Component className="w-3 h-3" />
                      Component Instance
                    </Badge>
                    {componentInfo.definition && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            selectComponent(componentInfo.definitionId); // Canvas Domain
                            selectionCommands.selectNodes([
                              componentInfo.definitionId,
                            ]); // React Flow Canvas Domain
                          }}
                        >
                          {componentInfo.definition.title}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={async () => {
                            // const result = await detachComponentInstance(
                            //   selectedSingleNodeId
                            // );
                            // if (!result.ok) {
                            //   console.error(
                            //     "Failed to detach component:",
                            //     result.error
                            //   );
                            // }
                          }}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {componentInfo.type === 'definition' && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      <Component className="w-3 h-3" />
                      Component Definition
                    </Badge>
                  </div>
                )}
              </div>
            )}
            {/* Regular Component Mode Badge */}
            {canvasMode === 'component' && !componentInfo && (
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  Component
                </Badge>
              </div>
            )}
            <Input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
              placeholder="제목 없음"
              maxLength={100}
            />
          </div>

          {/* Style Section */}
          <div className="border-b px-1">
            <StyleSection
              formData={{
                ...((selectedSingleNodeData?.data.formData as Record<
                  string,
                  unknown
                >) || {}),
                ...((selectedSingleNodeData?.data.nodeUI as Record<
                  string,
                  unknown
                >) || {}),
              }}
              schemaFields={fields.styleFields}
              componentInfo={componentInfo}
            />
          </div>

          {/* Property Section */}
          <div className="px-1">
            <PropertySection
              formData={
                selectedSingleNodeData?.data.formData as Record<string, unknown>
              }
              schemaFields={fields.propertyFields}
              componentInfo={componentInfo}
            />
          </div>

          {/* Comments Section */}
          {/* <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <div className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    console.log("Add comment");
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  댓글 추가
                </Button>
              </div>
            </div>
          </div> */}

          {/* Content Section */}
          {/* <ContentSection /> */}
        </div>
      </div>
    </div>
  );
}
