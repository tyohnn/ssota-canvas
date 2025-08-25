"use client";

import React from "react";
import {
  ReactFlowCanvasProvider,
  ReactFlowCanvasRenderer,
} from "@/domains/react-flow-canvas";
import type { ReactFlowCanvasConfig, ReactFlowCanvasEvents } from "@/domains/react-flow-canvas";

// Workflow Canvas 도메인에서 React Flow Canvas를 사용하는 예시
export function WorkflowCanvas() {
  // Workflow 도메인 상태 (예시)
  const workflowNodes = [
    { id: "start", type: "start", position: { x: 100, y: 100 }, data: { label: "Start" } },
    { id: "process", type: "process", position: { x: 300, y: 100 }, data: { label: "Process" } },
    { id: "end", type: "end", position: { x: 500, y: 100 }, data: { label: "End" } },
  ];

  const workflowEdges = [
    { id: "e1", source: "start", target: "process" },
    { id: "e2", source: "process", target: "end" },
  ];

  // React Flow Canvas 설정
  const config: ReactFlowCanvasConfig = {
    nodeTypes: {
      start: () => <div className="bg-green-500 text-white p-2 rounded">Start</div>,
      process: () => <div className="bg-blue-500 text-white p-2 rounded">Process</div>,
      end: () => <div className="bg-red-500 text-white p-2 rounded">End</div>,
    },
    minZoom: 0.1,
    maxZoom: 2,
    fitView: true,
    nodesDraggable: true,
    elementsSelectable: true,
    selectionOnDrag: false,
    panOnDrag: [1, 2],
    enableMultiSelection: true,
    enableDragSelection: true,
    showControls: true,
    showMiniMap: true,
    showBackground: true,
  };

  // Workflow 도메인 이벤트 핸들러
  const events: Partial<ReactFlowCanvasEvents> = {
    onNodeClick: (node, event) => {
      console.log("Workflow node clicked:", node.id);
      // Workflow 도메인 선택 상태 업데이트
    },

    onNodeDragStop: (node, event) => {
      console.log("Workflow node moved:", node.id, node.position);
      // Workflow 도메인 위치 업데이트
    },

    onConnect: (connection) => {
      console.log("Workflow nodes connected:", connection);
      // Workflow 도메인 연결 생성
    },
  };

  return (
    <div className="h-full w-full">
      <ReactFlowCanvasProvider config={config} events={events}>
        <ReactFlowCanvasRenderer />
      </ReactFlowCanvasProvider>
    </div>
  );
}
