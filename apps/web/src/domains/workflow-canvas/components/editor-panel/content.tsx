"use client";

import React from "react";
import { useEditorPanelContext } from "./context";
import { EditorPanelTabs } from "./tabs";

export function EditorPanelContent() {
  const { state, handlers } = useEditorPanelContext();
  const { activeTab } = state;
  const { setActiveTab } = handlers;

  return (
    <div className="h-full">
      <EditorPanelTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
