import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function Component() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Vertical slider</Label>
      <div className="flex h-40 justify-center">
        <Slider
          defaultValue={[5]}
          max={10}
          orientation="vertical"
          aria-label="Vertical slider"
        />
      </div>
    </div>
  );
}
