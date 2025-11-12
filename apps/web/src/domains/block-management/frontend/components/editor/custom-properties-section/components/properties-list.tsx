import type { ReactNode } from 'react';
import { useCustomPropertiesSectionContext } from '../core/context';
import { CustomPropertyItem } from './custom-property-item';
import { PropertiesListBox } from './properties-list-box';

export function PropertiesList(): ReactNode {
  const { customProperties } = useCustomPropertiesSectionContext();

  if (customProperties.length === 0) {
    return null;
  }

  return (
    <PropertiesListBox>
      {customProperties.map(property => (
        <CustomPropertyItem key={property.id} property={property} />
      ))}
    </PropertiesListBox>
  );
}
