"use client";

import { Time } from "@vidstack/react";

export function TimeGroup() {
  return (
    <div className="ml-2.5 flex items-center text-[var(--vs-font,12px)] font-medium">
      <Time className="time" type="current" />
      <div className="mx-1 text-white/80">/</div>
      <Time className="time" type="duration" />
    </div>
  );
}
