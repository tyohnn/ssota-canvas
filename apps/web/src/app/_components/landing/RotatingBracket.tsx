"use client";

import { useEffect, useMemo, useState } from "react";
import BlurText from "@workspace/ui/components/react-bits/text-animations/BlurText/BlurText";

export default function RotatingBracket({
  items,
  intervalMs = 2500,
  className,
}: {
  items: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((v) => (v + 1) % items.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  const reservedCh = useMemo(
    () => Math.max(...items.map((s) => s.length)) + 1,
    [items]
  );

  return (
    <span
      className={`inline-block align-bottom text-primary ${className ?? ""}`}
      style={{ width: `${reservedCh}ch` }}
    >
      <BlurText
        key={idx}
        text={items[idx]}
        animateBy="letters"
        delay={12}
        className="inline"
        stepDuration={0.25}
      />
    </span>
  );
}
