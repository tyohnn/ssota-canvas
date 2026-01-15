import { Label as LabelComponent } from '@/components/ui/label';

export function NameLabel({ title }: { title: string }) {
  return (
    <LabelComponent
      htmlFor="property-name"
      className="text-xs font-medium text-muted-foreground"
    >
      {title}
    </LabelComponent>
  );
}
