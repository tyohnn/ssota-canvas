import { cn } from "@workspace/ui/lib/utils";
import { type CSSProperties, type ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export function Section({ children, className, id, style }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "min-h-screen w-full flex flex-col justify-center items-center py-20 px-4 md:px-8 relative overflow-hidden",
        className
      )}
      style={style}
    >
      <div className="max-w-7xl w-full mx-auto h-full flex flex-col">
        {children}
      </div>
    </section>
  );
}
