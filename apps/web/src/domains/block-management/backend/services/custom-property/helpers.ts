import { randomUUID } from 'crypto';

import { PropertyOptionVO } from '../../../shared/value-objects/property-option.vo';
import type { PropertyOptionInput } from './types';

export function mapOptions(options?: PropertyOptionInput[]): PropertyOptionVO[] {
  if (!options || options.length === 0) {
    return [];
  }

  return options.map(option =>
    PropertyOptionVO.fromJSON({
      id: option.id ?? randomUUID(),
      label: option.label,
      value: option.value ?? option.id ?? option.label,
      color: option.color,
      order: option.order ?? 0,
      disabled: option.disabled ?? false,
      description: option.description,
    })
  );
}
