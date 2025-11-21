import { useCustomPropertyItemContext } from '../core/context';
import { PropertyIcon } from './property-icon';

export function Label() {
  const {
    property: { icon, name },
  } = useCustomPropertyItemContext();

  return (
    <>
      <PropertyIcon icon={icon} />
      <span className="w-full text-xs text-left font-medium truncate text-muted-foreground">
        {name}
      </span>
    </>
  );
}
