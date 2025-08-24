"use client";

import React from "react";
import { Controller } from "react-hook-form";
import { Label } from "@workspace/ui/components/ui/label";
import { Input } from "@workspace/ui/components/ui/input";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";

interface FormFieldRendererProps {
  field: any;
  control: any;
  error?: any;
  showHiddenFields?: boolean;
}

export function FormFieldRenderer({
  field,
  control,
  error,
  showHiddenFields = false,
}: FormFieldRendererProps) {
  // For hidden fields, just render the Controller without any UI
  if (field.type === "hidden") {
    if (!showHiddenFields) {
      return null;
    }
    return (
      <Controller
        name={field.id}
        control={control}
        render={({ field: fieldProps }) => (
          <input {...fieldProps} id={field.id} type="hidden" />
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={field.id}
          className="text-sm font-medium text-foreground"
        >
          {field.label}
          {field.validation?.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        {field.id === "slug" && (
          <span className="text-xs text-muted-foreground/50">
            (auto-generated)
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-muted-foreground/50">{field.description}</p>
      )}

      <Controller
        name={field.id}
        control={control}
        render={({ field: fieldProps }) => {
          switch (field.type) {
            case "text":
              return (
                <Input
                  {...fieldProps}
                  id={field.id}
                  placeholder={field.placeholder}
                  readOnly={field.id === "slug"}
                  className={`placeholder:text-muted-foreground/50 ${error ? "border-destructive focus:ring-destructive" : ""}`}
                />
              );

            case "textarea":
            case "textarea-single":
              return (
                <Textarea
                  {...fieldProps}
                  id={field.id}
                  placeholder={field.placeholder}
                  rows={field.type === "textarea-single" ? 2 : 3}
                  className={`resize-none placeholder:text-muted-foreground/50 ${error ? "border-destructive focus:ring-destructive" : ""}`}
                />
              );

            case "textarea-multi":
              return (
                <Textarea
                  {...fieldProps}
                  id={field.id}
                  placeholder={field.placeholder}
                  rows={6}
                  className={`resize-vertical placeholder:text-muted-foreground/50 ${error ? "border-destructive focus:ring-destructive" : ""}`}
                />
              );

            case "select":
              return (
                <Select
                  value={fieldProps.value}
                  onValueChange={fieldProps.onChange}
                >
                  <SelectTrigger
                    id={field.id}
                    className={
                      error ? "border-destructive focus:ring-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case "checkbox":
              return (
                <Checkbox
                  id={field.id}
                  checked={fieldProps.value}
                  onCheckedChange={fieldProps.onChange}
                  className={error ? "border-destructive" : ""}
                />
              );

            case "number":
              return (
                <Input
                  {...fieldProps}
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  className={
                    error ? "border-destructive focus:ring-destructive" : ""
                  }
                />
              );

            default:
              return (
                <Input
                  {...fieldProps}
                  placeholder={field.placeholder}
                  className={`placeholder:text-muted-foreground/50 ${error ? "border-destructive" : ""}`}
                />
              );
          }
        }}
      />

      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
