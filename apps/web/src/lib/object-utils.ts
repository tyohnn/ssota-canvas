/**
 * Object utility functions for filtering and transforming objects
 */

/**
 * Remove undefined values from an object
 */
export function omitUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Pick only defined (non-undefined) values from an object
 */
export function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Create a database update payload by filtering out undefined values
 * and separating top-level fields from metadata fields.
 * Preserves existing metadata structure and applies default values for empty objects.
 */
export function createDbUpdatePayload<
  T extends Record<string, any>,
  TopLevel extends keyof T = never,
  Metadata extends keyof T = never
>(
  updates: T,
  topLevelFields: TopLevel[],
  metadataFields: Metadata[] = [],
  existingMetadata: Record<string, any> = {}
): {
  [K in TopLevel]?: T[K];
} & {
  metadata?: {
    [K in Metadata]?: T[K];
  } & Record<string, any>;
} {
  const result: any = {};
  
  // Add top-level fields
  topLevelFields.forEach(field => {
    if (updates[field] !== undefined) {
      result[field] = updates[field];
    }
  });
  
  // Start with existing metadata to preserve untouched fields
  const metadata: Record<string, any> = { ...existingMetadata };
  
  // Process metadata fields with merging and default values
  metadataFields.forEach(field => {
    const fieldKey = field as string;
    if (updates[field] !== undefined) {
      const existingValue = existingMetadata[fieldKey];
      const updateValue = updates[field];
      
      // Apply default values and merge
      if (fieldKey === 'formData') {
        metadata[fieldKey] = {
          ...existingValue,
          ...updateValue
        };
      } else if (fieldKey === 'formSchema') {
        metadata[fieldKey] = {
          fields: [],
          ...existingValue,
          ...updateValue
        };
      } else if (fieldKey === 'nodeUI') {
        metadata[fieldKey] = {
          ...existingValue,
          ...updateValue
        };
      } else {
        metadata[fieldKey] = updateValue;
      }
    } else {
      // Apply default values for undefined fields
      if (fieldKey === 'formData' && !existingMetadata[fieldKey]) {
        metadata[fieldKey] = {};
      } else if (fieldKey === 'formSchema' && !existingMetadata[fieldKey]) {
        metadata[fieldKey] = { fields: [] };
      }
    }
  });
  
  // Add any other fields that aren't in topLevelFields or metadataFields
  Object.keys(updates).forEach(key => {
    if (!topLevelFields.includes(key as TopLevel) && 
        !metadataFields.includes(key as Metadata) && 
        updates[key] !== undefined) {
      metadata[key] = updates[key];
    }
  });
  
  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }
  
  return result;
}

/**
 * Type-safe version of createDbUpdatePayload with explicit typing
 */
export function createTypedDbUpdatePayload<
  T extends Record<string, any>,
  TopLevel extends keyof T,
  Metadata extends keyof T
>(
  updates: T,
  topLevelFields: TopLevel[],
  metadataFields: Metadata[] = [] as Metadata[],
  existingMetadata: Record<string, any> = {}
): {
  [K in TopLevel]?: T[K];
} & {
  metadata?: {
    [K in Metadata]?: T[K];
  } & Record<string, any>;
} {
  return createDbUpdatePayload(updates, topLevelFields, metadataFields, existingMetadata) as any;
}
