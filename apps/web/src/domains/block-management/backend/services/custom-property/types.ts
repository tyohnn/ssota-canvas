export type PropertyOptionInput = {
  id?: string;
  label: string;
  value?: string;
  color?: string;
  order?: number;
  disabled?: boolean;
  description?: string;
};

export type PropertyValidationInput = {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
};

export interface AddCustomPropertyCommand {
  blockSlug: string;
  workspaceId: string;
  property: {
    id?: string;
    name: string;
    type: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
}

export interface UpdateCustomPropertyCommand {
  blockSlug: string;
  workspaceId: string;
  propertyId: string;
  updates: {
    name?: string;
    type?: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
}

export interface DeleteCustomPropertyCommand {
  blockSlug: string;
  workspaceId: string;
  propertyId: string;
}
