"use client";

import React, { memo } from "react";

interface ArtifactTemplateNodeData {
  label: string;
  slug: string;
  artifact_format?: string;
}

export const ArtifactTemplateNode = memo(({ data, selected }: any) => {
  const { label, slug, artifact_format } = data;

  return (
    <div
      className={`relative ${selected ? "ring-2 ring-purple-500 ring-offset-2" : ""}`}
    >
      <div className="w-64 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-purple-900 truncate">
              {label}
            </h3>
            <p className="text-xs text-purple-600 truncate">{slug}</p>
          </div>
        </div>
        {artifact_format && (
          <p className="text-xs text-purple-700">{artifact_format}</p>
        )}
      </div>
    </div>
  );
});

ArtifactTemplateNode.displayName = "ArtifactTemplateNode";
