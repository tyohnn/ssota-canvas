import { Label as LabelComponent } from '@/components/ui/label';

export function Label({ title = 'Add Custom Property' }: { title?: string }) {
  return (
    <LabelComponent
      htmlFor="custom-property-name"
      className="text-xs font-medium text-muted-foreground"
    >
      {title}
    </LabelComponent>
  );
}
