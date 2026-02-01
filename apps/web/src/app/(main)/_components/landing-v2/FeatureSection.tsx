"use client";

import { Section } from "./Section";
import {
  ChatBoardsCard,
  AgentBoardCard,
  ManyViewsCard,
  ResearchToPlanCard,
} from "./sections/feature-sections";

export function FeatureSection() {
  return (
    <Section className="bg-background py-20 relative overflow-hidden" id="features">
      {/* Canvas-style grid background (after first demo) */}
      <div
        className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 flex flex-col items-center mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Why SSOTA?
        </h2>
        <p className="text-lg text-muted-foreground">
          Built for deep work, not quick chats.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full auto-rows-[350px]">
        <ChatBoardsCard />
        <AgentBoardCard />
        <ResearchToPlanCard />
        <ManyViewsCard />
      </div>
    </Section>
  );
}
