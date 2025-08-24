"use client";

import React, { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { useEditorPanelContext } from "./context";
import { toast } from "@workspace/ui/components/ui/sonner";

export function EditorPanelFooter() {
  const { state, handlers, handleCloseEditorWithCentering } =
    useEditorPanelContext();
  const { hasChanges, activeTab, formMethods } = state;
  const { onSubmit } = handlers;
  const [isSaving, setIsSaving] = useState(false);

  // Get errors from react-hook-form
  const errors = formMethods?.formState?.errors || {};
  const errorCount = Object.keys(errors).length;
  const isValid = formMethods?.formState?.isValid ?? true;

  const showSaveButton =
    hasChanges && (activeTab === "configuration" || activeTab === "design");

  const handleSaveClick = async () => {
    if (formMethods && isValid && !isSaving) {
      setIsSaving(true);
      try {
        await formMethods.handleSubmit(onSubmit)();
        toast.success("Changes saved successfully!");
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save changes. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="text-xs text-muted-foreground">
        {hasChanges && errorCount === 0 && "You have unsaved changes"}
        {hasChanges && errorCount > 0 && (
          <span className="text-red-500">
            {errorCount} validation error{errorCount > 1 ? "s" : ""}
          </span>
        )}
        {!hasChanges && "All changes saved"}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCloseEditorWithCentering}
          className="h-8 px-3 text-xs"
        >
          Cancel
        </Button>
        {showSaveButton && (
          <Button
            size="sm"
            onClick={handleSaveClick}
            className="h-8 px-3 text-xs"
            disabled={!isValid || errorCount > 0 || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1.5" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}
