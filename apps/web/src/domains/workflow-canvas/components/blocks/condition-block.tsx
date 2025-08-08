"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { getBlockColorClasses } from "@/domains/workflow-canvas/policy";

interface ConditionBlockProps {
  data: {
    label?: string;
    description?: string;
  };
  selected?: boolean;
}

export function ConditionBlock({ data, selected }: ConditionBlockProps) {
  const colorClasses = getBlockColorClasses("blue"); // 워크플로우 색상 사용

  return (
    <div
      className={`relative flex items-center justify-center min-w-[120px] min-h-[60px] ${
        selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      {/* 다이아몬드 모양의 조건 블록 */}
      <div
        className={`w-full h-full transform rotate-45 border-2 ${colorClasses.border200} ${colorClasses.bg50} ${colorClasses.text700}`}
        style={{
          width: "120px",
          height: "60px",
        }}
      >
        {/* 내부 콘텐츠 영역 */}
        <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
          <div className="flex flex-col items-center gap-1">
            {/* 아이콘 */}
            <div className={`p-1 rounded ${colorClasses.bg500} text-white`}>
              <GitBranch className="h-3 w-3" />
            </div>

            {/* 라벨 */}
            <div className="text-center">
              <p className="text-xs font-medium truncate max-w-[80px]">
                {data.label || "Condition"}
              </p>
              {data.description && (
                <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {data.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 핸들들 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ top: "-6px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ bottom: "-6px" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: "-6px" }}
        id="true"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: "-6px" }}
        id="false"
      />
    </div>
  );
}
