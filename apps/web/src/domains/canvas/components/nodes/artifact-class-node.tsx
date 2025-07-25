"use client";

import React, { memo } from "react";

interface ArtifactClassNodeData {
  label: string;
  slug: string;
}

export const ArtifactClassNode = memo(({ data, selected }: any) => {
  const { label, slug } = data;

  return (
    <div
      className={`relative ${selected ? "ring-2 ring-lime-500 ring-offset-2" : ""}`}
    >
      <div className="w-64 bg-gradient-to-br from-lime-50 to-lime-100 border-2 border-lime-200 rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AC</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-lime-900 truncate">
              {label}
            </h3>
            <p className="text-xs text-lime-600 truncate">{slug}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ArtifactClassNode.displayName = "ArtifactClassNode";
