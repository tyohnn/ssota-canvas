"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { useReactFlowSelection } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
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
import { RefreshCw, Copy } from "lucide-react";

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
}

function DebugItem({ label, value, type }: DebugItemProps) {
  const formatValue = (val: any): string => {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (typeof val === "object") {
      const keys = Object.keys(val);
      if (keys.length <= 3) {
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
}

function DebugAccordionItem({
  label,
  value,
  defaultOpen = false,
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
  const { state: selectionState } = useReactFlowSelection();
  const { 
    canvasMode, 
    selectedPageId, 
    selectedPageBlock,
    selectedComponentId,
    getPageBlockById,
    getComponentBlockById
  } = useCanvasData();
  const panelState = usePanel();
  
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());

  const refresh = () => {
    setLastUpdate(Date.now());
  };

  // Get selected node data
  const selectedNodeId = selectionState.selectedSingleNodeId;
  const selectedNode = selectedNodeId ? rf.getNode(selectedNodeId) : null;
  
  // Get block and component data
  const selectedBlock = selectedPageBlock;
  const selectedComponent = selectedComponentId ? getComponentBlockById(selectedComponentId) : null;

  // Get all React Flow nodes
  const allNodes = rf.getNodes();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">React Flow Debug Panel</h3>
        </div>
        <div className="flex items-center gap-2">
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
            {/* Canvas Data */}
            <DebugSection title="Canvas Data" count={4}>
              <DebugItem 
                label="Canvas Mode" 
                value={canvasMode} 
              />
              <DebugItem 
                label="Selected Page ID" 
                value={selectedPageId || "None"} 
              />
              <DebugItem 
                label="Selected Block ID" 
                value={selectedPageBlock?.id || "None"} 
              />
              <DebugItem 
                label="Selected Component ID" 
                value={selectedComponentId || "None"} 
              />
            </DebugSection>

            <Separator />

            {/* Selected Block */}
            <DebugSection title="Selected Block" count={3}>
              <DebugItem 
                label="Block Exists" 
                value={!!selectedBlock} 
                type="boolean" 
              />
              <DebugItem 
                label="Block ID" 
                value={selectedBlock?.id || "None"} 
              />
              <DebugItem 
                label="Block Type" 
                value={selectedBlock?.block_type || "None"} 
              />
              <DebugAccordionItem
                label="Full Block Object"
                value={selectedBlock}
              />
            </DebugSection>

            <Separator />

            {/* Selected Component */}
            <DebugSection title="Selected Component" count={3}>
              <DebugItem 
                label="Component Exists" 
                value={!!selectedComponent} 
                type="boolean" 
              />
              <DebugItem 
                label="Component ID" 
                value={selectedComponent?.id || "None"} 
              />
              <DebugItem 
                label="Component Title" 
                value={selectedComponent?.title || "None"} 
              />
              <DebugAccordionItem
                label="Full Component Object"
                value={selectedComponent}
              />
            </DebugSection>

            <Separator />

            {/* React Flow Nodes */}
            <DebugSection title="React Flow Nodes" count={allNodes.length}>
              <DebugItem 
                label="Total Nodes" 
                value={allNodes.length} 
                type="number" 
              />
              <DebugItem 
                label="Selected Node ID" 
                value={selectedNodeId || "None"} 
              />
              <DebugItem 
                label="Selected Node Exists" 
                value={!!selectedNode} 
                type="boolean" 
              />
              <DebugAccordionItem
                label="All React Flow Nodes"
                value={allNodes}
              />
            </DebugSection>

            <Separator />

            {/* Selected Node Details */}
            <DebugSection title="Selected Node Details" count={4}>
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
                label="Full Selected Node"
                value={selectedNode}
              />
            </DebugSection>

            <Separator />

            {/* Selection State */}
            <DebugSection title="Selection State" count={3}>
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
              <DebugAccordionItem
                label="Selected Node IDs"
                value={selectionState.selectedNodeIds}
              />
            </DebugSection>

            <Separator />

            {/* Panel State */}
            <DebugSection title="Panel State" count={4}>
              <DebugItem 
                label="Active Explorer Tab" 
                value={panelState.activeExplorerTab} 
              />
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
            </DebugSection>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
