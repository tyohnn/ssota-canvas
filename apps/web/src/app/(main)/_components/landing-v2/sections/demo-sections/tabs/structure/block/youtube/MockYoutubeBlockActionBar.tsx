/**
 * Mock Youtube Block Action Bar
 *
 * Structure 탭 전용 Action Bar.
 * Extract Summary (완료 상태) + Visual Summary (하이라이트/팝오버).
 */

'use client';

import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { BlockActionBarView } from "@/domains/block-management/frontend/components/block/block-action-bar/block-action-bar.view";
import { MockExtractSummaryActionView } from "./MockExtractSummaryActionView";
import { MockVisualSummaryActionView } from "./MockVisualSummaryActionView";
import { getAllTemplates } from "@/domains/ai-actions/backend/prompt/visual-summary";
import { SUPPORTED_LANGUAGES } from "@/domains/youtube-app-space/shared/value-objects/language-code.vo";
import { StepHighlight } from "../../../../../../../mocks/components/StepHighlight";
import { MockTemplateSelectorContent } from "./MockTemplateSelectorContent";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ru: "Русский",
  ar: "العربية",
};

const LANGUAGES = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
}));

interface MockYoutubeBlockActionBarProps {
  step: number;
}

export function MockYoutubeBlockActionBar({ step }: MockYoutubeBlockActionBarProps) {
  const [showExtractSummaryPopover, setShowExtractSummaryPopover] = useState(false);
  const [showVisualSummaryPopover, setShowVisualSummaryPopover] = useState(false);

  // Structure 탭: step 1부터 summary 이미 있음
  const hasSummary = step >= 1;
  const availableLanguagesForStep = hasSummary ? ["en"] : [];

  // Visual Summary 플로우: step 2 하이라이트, step 3 팝오버
  const isVisualSummaryHighlighted = step >= 2;
  const showVisualSummaryPopoverFromStep = step === 3;
  const isVisualSummaryPopoverOpen =
    showVisualSummaryPopoverFromStep || showVisualSummaryPopover;

  const templates = getAllTemplates();
  const argumentMapTemplate = templates.find((t) => t.id === "argument-map");
  const highlightTemplateId =
    step === 3 && argumentMapTemplate ? argumentMapTemplate.id : null;

  const visualSummaryPopoverContent = (
    <MockTemplateSelectorContent
      templates={templates}
      selectedTemplateId={null}
      onTemplateSelect={() => { }}
      highlightTemplateId={highlightTemplateId}
    />
  );

  const extractSummaryIcon = hasSummary ? (
    <Check className="text-green-600" />
  ) : (
    <Sparkles />
  );

  return (
    <BlockActionBarView show={true}>
      {/* Extract Summary - 완료 상태 (Structure는 step 1부터 summary 있음) */}
      <MockExtractSummaryActionView
        isPopoverOpen={false}
        onPopoverOpenChange={setShowExtractSummaryPopover}
        icon={extractSummaryIcon}
        tooltip="Extract Summary"
        disabled={false}
        languages={LANGUAGES}
        availableLanguages={availableLanguagesForStep}
        onLanguageSelect={() => { }}
      />

      {/* Visual Summary - step 2 하이라이트, step 3 팝오버 */}
      <StepHighlight
        isActive={isVisualSummaryHighlighted}
        pointer="top"
        label="Visual Summary"
        className="inline-block"
        cursorAction={step === 2 ? "click" : undefined}
      >
        <MockVisualSummaryActionView
          icon={<Sparkles />}
          tooltip="Generate Visual Summary"
          disabled={false}
          isPopoverOpen={isVisualSummaryPopoverOpen}
          onPopoverOpenChange={setShowVisualSummaryPopover}
          popoverContent={visualSummaryPopoverContent}
        />
      </StepHighlight>
    </BlockActionBarView>
  );
}
