"use client";

import React from "react";
import { useEditorPanelContext } from "../context";
import { FormGroup } from "@/domains/workflow-canvas/policy/editor-rendering-policy";
import { FormFieldRenderer } from "./form-field-renderer";
import { Separator } from "@workspace/ui/components/ui/separator";

export function ConfigurationTab() {
  const { state, handlers } = useEditorPanelContext();
  const { editorConfig, formMethods, selectedItem } = state;
  const { onSubmit } = handlers;

  if (!selectedItem) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No block selected</p>
        <p className="text-xs mt-2">Please select a block to edit.</p>
      </div>
    );
  }

  if (!editorConfig || !formMethods) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Loading editor configuration...</p>
        <p className="text-xs mt-2">Please wait while the editor loads.</p>
      </div>
    );
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  // Find the basic and configuration groups from formGroups
  const basicGroup = editorConfig.formGroups?.find(
    (group) => group.id === "basic"
  );
  const configurationGroup = editorConfig.formGroups?.find(
    (group) => group.id === "configuration"
  );

  if (!basicGroup && !configurationGroup) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No configuration available for this block type</p>
        <p className="text-xs mt-2">
          This block type doesn't have configuration settings.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Group */}
      {basicGroup && (
        <FormGroupRenderer
          key={basicGroup.id}
          group={basicGroup}
          control={control}
          errors={errors}
        />
      )}
      <Separator />
      {/* Configuration Group */}
      {configurationGroup && (
        <FormGroupRenderer
          key={configurationGroup.id}
          group={configurationGroup}
          control={control}
          errors={errors}
        />
      )}
    </form>
  );
}

interface FormGroupRendererProps {
  group: FormGroup;
  control: any;
  errors: any;
}

function FormGroupRenderer({ group, control, errors }: FormGroupRendererProps) {
  return (
    <div className="space-y-4">
      {/* Group Header */}
      <div className="pb-2">
        <h4 className="text-md font-medium text-foreground">{group.label}</h4>
        {group.description && (
          <p className="text-sm text-muted-foreground/50 mt-1">
            {group.description}
          </p>
        )}
      </div>

      {/* Group Fields */}
      <div className="space-y-4">
        {group.fields.map((field) => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            control={control}
            error={errors[field.id]}
            showHiddenFields={true}
          />
        ))}
      </div>
    </div>
  );
}
