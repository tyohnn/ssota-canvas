"use client";

import React from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { isComponentInstance } from "@/domains/canvas/types/component";
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
import { RefreshCw } from "lucide-react";

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
      return `{${keys.length} keys}`;
    }
    return String(val);
  };

  return (
    <div className="flex items-start justify-between py-1 px-2 rounded hover:bg-muted/50">
      <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
        {label}:
      </span>
      <div className="flex-1 text-right">
        <span className="text-xs text-foreground font-mono">
          {formatValue(value)}
        </span>
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
            <span className="text-muted-foreground">{label}:</span>
            <span className="text-foreground font-mono">
              {formatValue(value)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-2">
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 border break-words whitespace-pre-wrap">
            {JSON.stringify(value, null, 2)}
          </pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function SSOTDebugPanel() {
  const data = useCanvasData();
  const sel = useCanvasSelection();
  const ui = useUiLayout();
  const commands = useCanvasCommandsContext();
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());

  const refresh = () => {
    setLastUpdate(Date.now());
  };

  // Convert data to arrays for compatibility with existing debug logic
  const blocks = Object.values(data.blocksById);
  const positions = Object.values(data.positionsByPage).flatMap(
    (x) => x.positions
  );
  const edges = Object.values(data.edgesById);

  // Get canvas mode from selection context
  const { canvasMode } = sel;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
        <h3 className="text-sm font-semibold">SSOT Debug Panel</h3>
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
            {/* Mode & Selection */}
            <DebugSection title="Mode & Selection" count={2}>
              <DebugItem label="Canvas Mode" value={canvasMode} />
              <DebugItem label="Active Left Tab" value={ui.activeLeftTab} />
            </DebugSection>

            <Separator />

            {/* Page Selection */}
            <DebugSection title="Page Selection" count={3}>
              <DebugItem
                label="Selected Page"
                value={
                  sel.pageId
                    ? data.blocksById[sel.pageId]?.name || "None"
                    : "None"
                }
              />
              <DebugItem label="Page ID" value={sel.pageId || "None"} />
              <DebugAccordionItem
                label="Page Object"
                value={sel.pageId ? data.blocksById[sel.pageId] : null}
              />
            </DebugSection>

            <Separator />

            {/* Component Selection */}
            <DebugSection title="Component Selection" count={3}>
              <DebugItem
                label="Selected Component"
                value={
                  sel.componentId
                    ? data.blocksById[sel.componentId]?.name || "None"
                    : "None"
                }
              />
              <DebugItem
                label="Component ID"
                value={sel.componentId || "None"}
              />
              <DebugAccordionItem
                label="Component Object"
                value={
                  sel.componentId ? data.blocksById[sel.componentId] : null
                }
              />
            </DebugSection>

            <Separator />

            {/* Component Actions */}
            <DebugSection title="Component Actions" count={3}>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const selectedNodeId = sel.nodeIds?.[0];
                    if (!selectedNodeId) {
                      alert("Please select a block first");
                      return;
                    }

                    const block = data.blocksById[selectedNodeId];
                    if (!block) {
                      alert("Selected block not found");
                      return;
                    }

                    console.log("🚀 Promoting block to component:", block);
                    const result =
                      await commands.promoteBlockToComponentDefinition(
                        selectedNodeId
                      );

                    if (result.ok) {
                      alert("Block promoted to component successfully!");
                      refresh();
                    } else {
                      alert(`Failed to promote block: ${result.error}`);
                    }
                  }}
                  disabled={!sel.nodeIds?.[0]}
                >
                  Promote Selected Block to Component
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const selectedNodeId = sel.nodeIds?.[0];
                    if (!selectedNodeId) {
                      alert("Please select a component instance first");
                      return;
                    }

                    const block = data.blocksById[selectedNodeId];
                    if (!block || !isComponentInstance(block)) {
                      alert("Selected block is not a component instance");
                      return;
                    }

                    console.log("🔗 Detaching component instance:", block);
                    const result =
                      await commands.detachComponentInstance(selectedNodeId);

                    if (result.ok) {
                      alert("Component instance detached successfully!");
                      refresh();
                    } else {
                      alert(
                        `Failed to detach component instance: ${result.error}`
                      );
                    }
                  }}
                  disabled={!sel.nodeIds?.[0]}
                >
                  Detach Selected Component Instance
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    console.log("🔄 Migrating existing instances...");
                    const result = await commands.migrateExistingInstances();

                    if (result.ok) {
                      alert("Migration completed successfully!");
                      refresh();
                    } else {
                      alert(`Migration failed: ${result.error}`);
                    }
                  }}
                >
                  Migrate Existing Instances
                </Button>

                {sel.nodeIds?.[0] && (
                  <div className="text-xs text-muted-foreground">
                    Selected:{" "}
                    {data.blocksById[sel.nodeIds[0]]?.name || "Unknown"}
                  </div>
                )}
              </div>
            </DebugSection>

            <Separator />

            {/* SSOT Data */}
            <DebugSection title="SSOT Data" count={5}>
              <DebugItem
                label="Total Blocks"
                value={blocks.length}
                type="number"
              />
              <DebugItem
                label="Page Blocks"
                value={blocks.filter((b) => b.object === "page").length}
                type="number"
              />
              <DebugItem
                label="Component Definitions"
                value={
                  blocks.filter(
                    (b) =>
                      b.object === "component" &&
                      (b.metadata as any)?.role === "definition"
                  ).length
                }
                type="number"
              />
              <DebugItem
                label="Component Instances"
                value={
                  blocks.filter(
                    (b) =>
                      b.object === "block" &&
                      (b.metadata as any)?.role === "instance"
                  ).length
                }
                type="number"
              />
              <DebugItem
                label="Component Blocks"
                value={blocks.filter((b) => b.object === "component").length}
                type="number"
              />
              <DebugItem
                label="Other Blocks"
                value={
                  blocks.filter(
                    (b) => b.object !== "page" && b.object !== "component"
                  ).length
                }
                type="number"
              />
              <DebugAccordionItem label="All Blocks Array" value={blocks} />
            </DebugSection>

            <Separator />

            {/* Component Data */}
            <DebugSection title="Component Data" count={8}>
              <DebugItem
                label="Component Definitions Count"
                value={Object.keys(data.componentDefinitionsById).length}
                type="number"
              />
              <DebugItem
                label="Component Instances Count"
                value={Object.keys(data.componentInstancesById).length}
                type="number"
              />
              <DebugItem
                label="Component Definitions IDs"
                value={Object.keys(data.componentDefinitionsById)}
              />
              <DebugAccordionItem
                label="Component Definitions Mapping"
                value={data.componentDefinitionsById}
                defaultOpen={false}
              />
              <DebugItem
                label="Component Instances IDs"
                value={Object.keys(data.componentInstancesById)}
              />
              <DebugAccordionItem
                label="Component Instances Mapping"
                value={data.componentInstancesById}
                defaultOpen={false}
              />
              <DebugItem
                label="Blocks with object='component'"
                value={blocks
                  .filter((b) => b.object === "component")
                  .map((b) => ({
                    id: b.id,
                    name: b.name,
                    object: b.object,
                    metadata: b.metadata,
                  }))}
              />
              <DebugItem
                label="Blocks with object='block' and role='instance'"
                value={blocks
                  .filter(
                    (b) =>
                      b.object === "block" &&
                      (b.metadata as any)?.role === "instance"
                  )
                  .map((b) => ({
                    id: b.id,
                    name: b.name,
                    object: b.object,
                    role: (b.metadata as any)?.role,
                    componentId: (b.metadata as any)?.component_id,
                  }))}
              />
              <DebugItem
                label="Component Type Check Results"
                value={blocks
                  .filter(
                    (b) =>
                      b.object === "component" ||
                      (b.object === "block" &&
                        (b.metadata as any)?.role === "instance")
                  )
                  .map((b) => ({
                    id: b.id,
                    name: b.name,
                    object: b.object,
                    isDefinition:
                      b.object === "component" &&
                      (b.metadata as any)?.role === "definition",
                    isInstance:
                      (b.object === "block" &&
                        (b.metadata as any)?.role === "instance") ||
                      (b.object === "component" &&
                        (b.metadata as any)?.role === "instance"),
                    role: (b.metadata as any)?.role,
                    componentKey: (b.metadata as any)?.component_key,
                    componentId: (b.metadata as any)?.component_id,
                  }))}
              />
              <DebugItem
                label="Problematic Blocks (role=instance but object!=block)"
                value={blocks
                  .filter(
                    (b) =>
                      (b.metadata as any)?.role === "instance" &&
                      b.object !== "block"
                  )
                  .map((b) => ({
                    id: b.id,
                    name: b.name,
                    object: b.object,
                    role: (b.metadata as any)?.role,
                    componentId: (b.metadata as any)?.component_id,
                  }))}
              />
            </DebugSection>

            <Separator />

            {/* Component Relationships */}
            <DebugSection title="Component Relationships" count={3}>
              <DebugItem
                label="Definition-Instance Pairs"
                value={Object.entries(data.componentDefinitionsById).map(
                  ([defId, def]) => {
                    const instances = data.getInstancesForDefinition(defId);
                    return {
                      definitionId: defId,
                      definitionName: def.name,
                      instanceCount: instances.length,
                      instanceIds: instances.map((inst) => inst.id),
                    };
                  }
                )}
              />
              <DebugItem
                label="Orphaned Instances"
                value={Object.values(data.componentInstancesById)
                  .filter((instance) => {
                    const definition = data.getComponentDefinitionById(
                      instance.metadata.component_id
                    );
                    return !definition;
                  })
                  .map((inst) => ({
                    instanceId: inst.id,
                    instanceName: inst.name,
                    missingDefinitionId: inst.metadata.component_id,
                  }))}
              />
              <DebugAccordionItem
                label="All Component Relationships"
                value={Object.entries(data.componentDefinitionsById).map(
                  ([defId, def]) => ({
                    definition: {
                      id: defId,
                      name: def.name,
                      componentKey: def.metadata.component_key,
                    },
                    instances: data
                      .getInstancesForDefinition(defId)
                      .map((inst) => ({
                        id: inst.id,
                        name: inst.name,
                        hasStyleOverrides: !!(
                          inst.metadata.node_ui &&
                          Object.keys(inst.metadata.node_ui).length > 0
                        ),
                      })),
                  })
                )}
                defaultOpen={false}
              />
            </DebugSection>

            <Separator />

            {/* Positions */}
            <DebugSection title="Positions" count={3}>
              <DebugItem
                label="Total Positions"
                value={positions.length}
                type="number"
              />
              <DebugItem
                label="Positions by Context"
                value={positions.reduce(
                  (acc, pos) => {
                    const contextId = pos.context_block_id as string;
                    acc[contextId] = (acc[contextId] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )}
              />
              <DebugAccordionItem
                label="All Positions Array"
                value={positions}
              />
            </DebugSection>

            <Separator />

            {/* Edges */}
            <DebugSection title="Edges" count={3}>
              <DebugItem
                label="Total Edges"
                value={edges.length}
                type="number"
              />
              <DebugItem
                label="Edge Types"
                value={edges.reduce(
                  (acc, edge) => {
                    const type = edge.edge_type as string;
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )}
              />
              <DebugAccordionItem label="All Edges Array" value={edges} />
            </DebugSection>

            <Separator />

            {/* Node Selection */}
            <DebugSection title="Node Selection" count={4}>
              <DebugItem label="Selected Node IDs" value={sel.nodeIds} />
              <DebugItem
                label="Selected Edge ID"
                value={sel.edgeId || "None"}
              />
              <DebugItem
                label="Selected Block"
                value={
                  sel.nodeIds.length > 0 && sel.nodeIds[0]
                    ? data.blocksById[sel.nodeIds[0]]?.name || "Unknown"
                    : "None"
                }
              />
              <DebugAccordionItem
                label="Selected Block Object"
                value={
                  sel.nodeIds.length > 0 && sel.nodeIds[0]
                    ? data.blocksById[sel.nodeIds[0]]
                    : null
                }
                defaultOpen={false}
              />
            </DebugSection>

            <Separator />

            {/* UI State */}
            <DebugSection title="UI State" count={3}>
              <DebugItem
                label="Show Block Insert Panel"
                value={ui.showBlockInsertPanel}
                type="boolean"
              />
              <DebugItem
                label="Show Editor Panel"
                value={ui.showEditorPanel}
                type="boolean"
              />
              <DebugItem
                label="Selected Block for Editor"
                value={ui.selectedBlockIdForEditor || "None"}
              />
            </DebugSection>

            <Separator />

            {/* Recent Blocks (last 5) */}
            <DebugSection title="Recent Blocks" count={5}>
              {blocks.slice(0, 5).map((block) => (
                <DebugItem
                  key={block.id}
                  label={`${block.object} - ${block.name}`}
                  value={{
                    id: block.id,
                    type: block.block_type,
                    object: block.object,
                    parent: block.parent_block_id,
                  }}
                />
              ))}
            </DebugSection>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
