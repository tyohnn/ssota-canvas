"use client";

import React from "react";
import { useEditorPanelContext } from "../context";

export function DesignTab() {
  const { state } = useEditorPanelContext();
  const { selectedItem, editorConfig } = state;

  if (!selectedItem) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No block selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-md font-semibold text-foreground">
          Design Settings
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Customize the visual appearance of this block
        </p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-12">
        <div className="bg-muted/30 rounded-lg p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
              />
            </svg>
          </div>

          <h4 className="text-lg font-medium text-foreground mb-2">
            Design Tools Coming Soon
          </h4>

          <p className="text-sm text-muted-foreground/70 mb-4">
            Visual customization options for blocks will be available in a
            future update.
          </p>

          <div className="text-xs text-muted-foreground/70">
            <p>Planned features:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Custom colors and themes</li>
              <li>• Icon selection</li>
              <li>• Size and positioning</li>
              <li>• Border and shadow styles</li>
              {editorConfig?.specialTools &&
                editorConfig.specialTools.length > 0 && (
                  <li>• Block-specific design tools</li>
                )}
            </ul>
          </div>
        </div>
      </div>

      {/* Block Type Info */}
      {editorConfig && (
        <div className="border border-border/30 rounded-lg p-4">
          <h4 className="text-md font-medium text-foreground mb-3">
            Block Type:{" "}
            {"block_type" in selectedItem ? selectedItem.block_type : "Edge"}
          </h4>

          {editorConfig.specialTools &&
            editorConfig.specialTools.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground/70">
                  Special design tools for this block type:
                </p>
                <div className="flex flex-wrap gap-2">
                  {editorConfig.specialTools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-1 bg-muted text-muted-foreground/70 text-xs rounded"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
