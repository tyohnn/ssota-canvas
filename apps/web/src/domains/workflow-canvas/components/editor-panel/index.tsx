"use client";

import React, { useState, useEffect } from "react";
import { EditorPanelProvider } from "./context";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import { EditorPanelHeader } from "./header";
import { EditorPanelContent as EditorPanelContentComponent } from "./content";
import { EditorPanelFooter } from "./footer";

interface EditorPanelProps {
  className?: string;
}

/**
 * Editor Panel Overlay System with Slide & Fade Animation
 */
function EditorPanelInner({ className }: EditorPanelProps) {
  const { showEditorPanel } = useCanvas();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (showEditorPanel) {
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
  }, [showEditorPanel]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-2/3 h-[85%] bg-background border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Fixed Header Component */}
        <div className="flex-shrink-0">
          <EditorPanelHeader />
        </div>

        {/* Scrollable Content Component */}
        <div className="flex-1 min-h-0">
          <EditorPanelContentComponent />
        </div>

        {/* Fixed Footer Component */}
        <div className="flex-shrink-0">
          <EditorPanelFooter />
        </div>
      </div>
    </div>
  );
}

export function EditorPanel({ className }: EditorPanelProps) {
  return (
    <EditorPanelProvider>
      <EditorPanelInner className={className} />
    </EditorPanelProvider>
  );
}
