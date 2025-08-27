"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { useSelection } from "@/domains/react-flow-canvas/contexts/SelectionContext";
import { useControl } from "@/domains/react-flow-canvas/contexts/ControlContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { Badge } from "@workspace/ui/components/ui/badge";
import { ScrollArea } from "@workspace/ui/components/ui/scroll-area";
import { Separator } from "@workspace/ui/components/ui/separator";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion";
import { RefreshCw, AlertTriangle, CheckCircle, Copy } from "lucide-react";

interface DebugSectionProps {
  title: string;
  children: React.ReactNode;
  count?: number;
}

function DebugSection({ title, children, count }: DebugSectionProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {title}
          {count !== undefined && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {count}
            </Badge>
          )}
        </h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface DebugItemProps {
  label: string;
  value: any;
  type?: "string" | "number" | "boolean" | "object" | "array";
  hasChanged?: boolean;
}

function DebugItem({ label, value, type, hasChanged }: DebugItemProps) {
  const formatValue = (val: any): string => {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (typeof val === "object") {
      // 객체의 경우 더 자세한 정보를 표시
      const keys = Object.keys(val);
      if (keys.length <= 3) {
        // 키가 3개 이하면 실제 값을 표시
        return `{${keys.map(k => `${k}: ${val[k]}`).join(', ')}}`;
      }
      return `{${keys.length} keys}`;
    }
    return String(val);
  };

  const copyToClipboard = () => {
    const textToCopy = typeof value === 'object' 
      ? JSON.stringify(value, null, 2) 
      : String(value);
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="flex items-start justify-between py-1 px-2 rounded hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {label}:
        </span>
        {hasChanged && (
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground font-mono">
          {formatValue(value)}
        </span>
        {typeof value === 'object' && value !== null && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-muted"
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface DebugAccordionItemProps {
  label: string;
  value: any;
  defaultOpen?: boolean;
  hasChanged?: boolean;
}

function DebugAccordionItem({
  label,
  value,
  defaultOpen = false,
  hasChanged = false,
}: DebugAccordionItemProps) {
  const formatValue = (val: any): string => {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (typeof val === "object") {
      const keys = Object.keys(val);
      return `{${keys.length} keys}`;
    }
    return String(val);
  };

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? label : undefined}
    >
      <AccordionItem value={label} className="border-none">
        <AccordionTrigger className="py-1 px-2 rounded hover:bg-muted/50 text-xs">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{label}:</span>
              {hasChanged && (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
            </div>
            <span className="text-foreground font-mono">
              {formatValue(value)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-2">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(value, null, 2))}
                title="Copy to clipboard"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 border break-words whitespace-pre-wrap pr-8">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function ReactFlowDebugPanel() {
  const rf = useReactFlow();
  const { state: selectionState, commands: selectionCommands } = useSelection();
  const { state: controlState, commands: controlCommands } = useControl();
  const panelState = usePanel();
  
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  const renderCountRef = React.useRef(0);
  const [previousData, setPreviousData] = React.useState<any>({});

  // Increment render count on every render
  renderCountRef.current += 1;

  const refresh = () => {
    setLastUpdate(Date.now());
  };

  // Get selected node data
  const selectedNodeId = selectionState.selectedSingleNodeId;
  const selectedNode = selectedNodeId ? rf.getNode(selectedNodeId) : null;
  const selectedNodeData = selectedNode?.data;
  const selectedBlock = selectedNodeData?.block;

  // Compare current data with previous data
  const currentData = {
    selectedNode,
    selectedNodeData,
    selectedBlock,
    selectedNodeId,
    viewport: rf.getViewport(),
    selection: selectionState,
    control: controlState,
    panel: panelState,
  };

  const hasChanged = React.useMemo(() => {
    const changed = JSON.stringify(currentData) !== JSON.stringify(previousData);
    return changed;
  }, [currentData, previousData]);

  // Update previous data when changed
  React.useEffect(() => {
    if (hasChanged) {
      setPreviousData(currentData);
    }
  }, [hasChanged, currentData]);

  // Track specific changes
  const [changeHistory, setChangeHistory] = React.useState<Array<{
    timestamp: number;
    type: string;
    details: string;
  }>>([]);

  React.useEffect(() => {
    if (hasChanged) {
      setChangeHistory(prev => [
        {
          timestamp: Date.now(),
          type: 'Data Change',
          details: `Selected node: ${selectedNodeId || 'None'}`,
        },
        ...prev.slice(0, 9), // Keep last 10 changes
      ]);
    }
  }, [hasChanged, selectedNodeId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">React Flow Debug Panel</h3>
          {hasChanged && (
            <Badge variant="destructive" className="text-xs">
              CHANGED
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Renders: {renderCountRef.current}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {new Date(lastUpdate).toLocaleTimeString()}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={refresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-4">
            {/* Render Info */}
            <DebugSection title="Render Info" count={4}>
              <DebugItem 
                label="Render Count" 
                value={renderCountRef.current} 
                type="number" 
              />
              <DebugItem 
                label="Last Change" 
                value={hasChanged ? "Just now" : "No recent changes"} 
              />
              <DebugItem 
                label="Data Changed" 
                value={hasChanged} 
                type="boolean" 
              />
              <DebugItem 
                label="Selected Node Changed" 
                value={selectedNodeId !== previousData.selectedNodeId} 
                type="boolean" 
              />
            </DebugSection>

            <Separator />

            {/* React Flow Internal State */}
            <DebugSection title="React Flow Internal State" count={4}>
              <DebugItem 
                label="Nodes Count" 
                value={rf.getNodes().length} 
                type="number" 
              />
              <DebugItem 
                label="Edges Count" 
                value={rf.getEdges().length} 
                type="number" 
              />
              <DebugItem 
                label="Viewport Changed" 
                value={JSON.stringify(rf.getViewport()) !== JSON.stringify(previousData.viewport)} 
                type="boolean" 
              />
              <DebugItem 
                label="Current Viewport" 
                value={{
                  x: Math.round(rf.getViewport().x),
                  y: Math.round(rf.getViewport().y),
                  zoom: Math.round(rf.getViewport().zoom * 100) / 100,
                }}
                type="object"
              />
            </DebugSection>

            <Separator />

            {/* Selection State */}
            <DebugSection title="Selection State" count={8}>
              <DebugItem 
                label="Selected Node ID" 
                value={selectedNodeId || "None"} 
              />
              <DebugItem 
                label="Selected Node Count" 
                value={selectionState.selectedNodeIds.length} 
                type="number" 
              />
              <DebugItem 
                label="Selected Edge Count" 
                value={selectionState.selectedEdgeIds.length} 
                type="number" 
              />
              <DebugItem 
                label="Node Selection Mode" 
                value={selectionState.nodeSelectionMode} 
              />
              <DebugItem 
                label="Selected Edge ID" 
                value={selectionState.selectedSingleEdgeId || "None"} 
              />
              <DebugItem 
                label="Edge Selection Mode" 
                value={selectionState.edgeSelectionMode} 
              />
              <DebugAccordionItem
                label="Selected Node IDs"
                value={selectionState.selectedNodeIds}
                hasChanged={hasChanged}
              />
              <DebugAccordionItem
                label="Selected Edge IDs"
                value={selectionState.selectedEdgeIds}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* Drag Selection State */}
            <DebugSection title="Drag Selection State" count={5}>
              <DebugItem 
                label="Is Dragging" 
                value={selectionState.dragSelection.isDragging} 
                type="boolean" 
              />
              <DebugItem 
                label="Is Ctrl Pressed" 
                value={selectionState.dragSelection.isCtrlPressed} 
                type="boolean" 
              />
              <DebugItem 
                label="Temp Selected Count" 
                value={selectionState.dragSelection.tempSelectedIds.length} 
                type="number" 
              />
              <DebugItem 
                label="Selection Box" 
                value={selectionState.dragSelection.selectionBox} 
                type="object"
              />
              <DebugAccordionItem
                label="Temp Selected IDs"
                value={selectionState.dragSelection.tempSelectedIds}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* React Flow Node Data */}
            <DebugSection title="React Flow Node Data" count={3}>
              <DebugItem 
                label="Node Exists" 
                value={!!selectedNode} 
                type="boolean" 
              />
              <DebugItem 
                label="Node Type" 
                value={selectedNode?.type || "None"} 
              />
              <DebugItem 
                label="Node Position" 
                value={selectedNode ? {
                  x: selectedNode.position.x,
                  y: selectedNode.position.y,
                } : null} 
              />
              <DebugItem 
                label="Node Dimensions" 
                value={selectedNode ? {
                  width: selectedNode.width,
                  height: selectedNode.height,
                } : null} 
              />
              <DebugAccordionItem
                label="Full React Flow Node"
                value={selectedNode}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* Node Data */}
            <DebugSection title="Node Data" count={2}>
              <DebugItem 
                label="Data Exists" 
                value={!!selectedNodeData} 
                type="boolean" 
              />
              <DebugAccordionItem
                label="Node Data Object"
                value={selectedNodeData}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* Block Data */}
            <DebugSection title="Block Data" count={4}>
              <DebugItem 
                label="Block Exists" 
                value={!!selectedBlock} 
                type="boolean" 
              />
              <DebugItem 
                label="Block ID" 
                value={(selectedBlock as any)?.id || "None"} 
              />
              <DebugItem 
                label="Block Type" 
                value={(selectedBlock as any)?.block_type || "None"} 
              />
              <DebugItem 
                label="Block Name" 
                value={(selectedBlock as any)?.name || "None"} 
              />
              <DebugAccordionItem
                label="Full Block Object"
                value={selectedBlock}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* Block Metadata */}
            <DebugSection title="Block Metadata" count={3}>
              <DebugItem 
                label="Metadata Exists" 
                value={!!(selectedBlock as any)?.metadata} 
                type="boolean" 
              />
              <DebugItem 
                label="Node UI Exists" 
                value={!!(selectedBlock as any)?.metadata?.node_ui} 
                type="boolean" 
              />
              <DebugAccordionItem
                label="Block Metadata"
                value={(selectedBlock as any)?.metadata || null}
                hasChanged={hasChanged}
              />
              <DebugAccordionItem
                label="Node UI Data"
                value={(selectedBlock as any)?.metadata?.node_ui || null}
                hasChanged={hasChanged}
              />
            </DebugSection>

            <Separator />

            {/* Control State */}
            <DebugSection title="Control State" count={4}>
              <DebugItem 
                label="Tool Mode" 
                value={controlState.toolMode} 
              />
              <DebugItem 
                label="Show Mini Map" 
                value={controlState.showMiniMap} 
                type="boolean" 
              />
              <DebugItem 
                label="Zoom Percent" 
                value={controlState.zoomPercent} 
                type="number" 
              />
              <DebugAccordionItem
                label="Viewport"
                value={controlState.viewport}
              />
            </DebugSection>

            <Separator />

            {/* Panel State */}
            <DebugSection title="Panel State" count={4}>
              <DebugItem 
                label="Show Block Insert Panel" 
                value={panelState.showBlockInsertPanel} 
                type="boolean" 
              />
              <DebugItem 
                label="Show Editor Panel" 
                value={panelState.showEditorPanel} 
                type="boolean" 
              />
              <DebugItem 
                label="Show Debug Panel" 
                value={panelState.showDebugPanel} 
                type="boolean" 
              />
              <DebugItem 
                label="Active Explorer Tab" 
                value={panelState.activeExplorerTab} 
              />
            </DebugSection>

            <Separator />

            {/* Change History */}
            <DebugSection title="Change History" count={changeHistory.length}>
              {changeHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  No changes recorded yet
                </div>
              ) : (
                changeHistory.map((change, index) => (
                  <div key={index} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(change.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-foreground">
                        {change.type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {change.details}
                    </span>
                  </div>
                ))
              )}
            </DebugSection>

            <Separator />

            {/* React Flow State */}
            <DebugSection title="React Flow State" count={3}>
              <DebugItem 
                label="Total Nodes" 
                value={rf.getNodes().length} 
                type="number" 
              />
              <DebugItem 
                label="Total Edges" 
                value={rf.getEdges().length} 
                type="number" 
              />
              <DebugItem 
                label="Viewport" 
                value={{
                  x: rf.getViewport().x,
                  y: rf.getViewport().y,
                  zoom: rf.getViewport().zoom,
                }}
                type="object"
              />
            </DebugSection>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
