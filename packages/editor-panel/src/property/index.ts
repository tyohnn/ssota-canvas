export { PropertyGroup, type PropertyGroupProps } from './property-group';
export type { PropertyGroupDefinition } from './types';

export { PropertyIcon, type PropertyIconProps } from './property-icon';
export * from './property-input';

export {
  BlockPropertiesSection,
  BlockPropertyRenderer,
  BlockPropertyRendererView,
  type BlockPropertiesSectionProps,
  type BlockPropertyRendererProps,
  type BlockPropertyRendererViewProps,
} from './block-properties-section';
export type {
  BlockEditorSchemaLike,
  PropertyUpdateDepsLike,
  BlockPropertiesSectionDeps,
} from './block-properties-section/core/types';

export {
  CustomPropertiesSection,
  type CustomPropertiesSectionProps,
} from './custom-properties-section';
export type { CustomPropertiesSectionDeps } from './custom-properties-section/core/types';

export {
  DetailPopoverTrigger,
  type DetailPopoverTriggerProps,
} from './detail-popover-trigger';
export { triggerVariants } from './detail-popover-trigger/components/detail-popover-trigger.view';

export {
  PropertyDetailPopover,
  type PropertyDetailPopoverProps,
} from './property-detail-popover';
export type {
  DetailPopoverFieldLike,
  PropertyDetailPopoverDeps,
} from './property-detail-popover/core/types';

export {
  CustomPropertyItem,
  type CustomPropertyItemProps,
} from './custom-property-item';
export type { CustomPropertyDefinitionLike } from './custom-property-item/core/types';
export type { CustomPropertyItemDeps } from './custom-property-item/core/use-custom-property-item';

export {
  CustomPropertyAddPopover,
  type CustomPropertyAddPopoverProps,
} from './custom-property-add-popover';
export type {
  CustomPropertyAddPopoverDeps,
  PropertyTypeLike,
} from './custom-property-add-popover/core/types';
