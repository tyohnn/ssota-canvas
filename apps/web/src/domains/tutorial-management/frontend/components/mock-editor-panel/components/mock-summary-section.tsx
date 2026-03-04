'use client';

import { Info } from 'lucide-react';
import { Globe } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { SUPPORTED_LANGUAGES } from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';
import {
  ExtractSummaryButton,
  SummaryContent,
  SummarySectionContainer,
} from '@workspace/editor-panel';
import {
  getLanguageName,
  useSummaryContentDeps,
} from '@/domains/editor-panel/frontend/adapters/summary-content-deps';
import type { VideoSummaryView } from '@/domains/youtube-app-space/shared/dtos/views/video-summary.views';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';
import { InteractionGuard } from '../../common/interaction-guard';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';

/**
 * 👉 Summary text (markdown) shown after "Extract Summary". Edit this string.
 */
const MOCK_SUMMARY = `
## 🧭 Finding the first users for a new startup product and evolving it into maturity
Most people aren't <strong>early adopters</strong>, so startups must search for rare individuals like the <strong>Gustafs</strong> with burning needs rather than persuade masses. <mark>The key insight is treating user acquisition as a <strong>search problem</strong>, not persuasion, leading to a <strong>minimum evolvable product</strong> that adapts via early feedback.</mark>

## 🚀 Build a minimum evolvable product by searching for desperate early users and iterating rapidly
- Target <strong>early adopters</strong> or those with <strong>burning problems</strong> through personal outreach, not broad marketing.
- <strong>Charge real money early</strong>, launch fast, study users anthropologically, and experiment without fearing <strong>churn</strong>.
This approach delivers <strong>sharper feedback</strong> from paying customers, enables <strong>path-dependent evolution</strong> shaped by early users, and frees founders from perfectionism by focusing on survival and adaptation in the <strong>phylogenetic tree</strong> of product development.

# 🎞️ Strategies for Acquiring Early Users and Evolving Startups into Mature Products

## 1. The Reality of First Users and the Need for a Minimum Evolvable Product

### 1.1 Rare Early Adopters Exist Despite Widespread Resistance
- Few people join as a startup's <strong>first 10 users</strong> or paying customers, as most avoid unproven products.
  a. <strong>Gustaf</strong> at Airbnb loved testing startups and introducing them company-wide.
  b. Others try anything solving a <strong>burning issue</strong>, like the speaker's team paying a startup for a quick <strong>inference API billing solution</strong> within <strong>3 days</strong>.
- Acquisition is a <strong>search problem</strong>, not persuasion—hunt for <strong>Gustafs and Ankits</strong> eager for novelty or relief.

### 1.2 Shift from Minimum Viable to Minimum Evolvable Product
- Early versions must <mark>survive contact</mark> with tiny groups and evolve, not be final forms.
- Build basic functions to expose to <strong>market pressures</strong>, allowing rapid adaptation.

## 2. Counterintuitive Strategies for Engaging Early Users

### 2.1 Charge Real Money from Day One
- <strong>Early adopters</strong> and desperate users ignore price; focus on <strong>feedback quality</strong>.
  a. Paying customers provide <strong>sharper feedback</strong> than free users—angry high-payers motivate more than indifferent ones.
  b. Revenue is secondary; validation comes from real stakes.

### 2.2 Use Targeted Personal Outreach and Launch Early
- Skip billboards; opt for <strong>cold emails</strong> or door-knocks to reach niches.
- YC mantra: <strong>Launch early</strong> to maximize <strong>surface area</strong> for unknown early users.

### 2.3 Study and Experiment Relentlessly Without Fearing Churn
- Act as an <strong>anthropologist</strong>: Analyze decisions, trust factors, and desires of early users.
- Run constant <strong>experiments</strong> on pricing, onboarding, features; fix annoyances personally.
  a. <strong>Churn is fine</strong>—relationships are direct, and irrelevance (not headlines) is the foe.
  b. Startups win by iterating unseen, unlike big companies.

## 3. Early Users Shape Market and Product Direction

### 3.1 B2B and High-Value Niches Over Consumer Apps
- Consumer software budgets are tiny (<strong>$150/month</strong> personally vs. corporate tools exceeding that).
- In <strong>AI era</strong>, target <strong>proumers</strong>, businesses, or high-ad-value users like doctors—ads rarely cover AI costs.

### 3.2 Early Users Steer Long-Term Evolution
- Users don't just feedback; they <mark>path-dependently evolve</mark> the product via preferences.

## 4. Phylogenetic Tree Analogy and Tesla Case Study

### 4.1 Startups as Evolving Organisms
- View startups as <strong>phylogenetic tree</strong>: From <strong>amoeba</strong> (basic survival) to complex leaves (mature products).
  a. Founders run <strong>evolutionary search</strong> through pressures, morphing via user interactions.
  b. Maturity emerges from millions of users, refined pitches—not starting perfect.

### 4.2 Tesla Roadster as Amoeba Probing Early Adopters
- <strong>Tesla Roadster</strong> ($<strong>150,000</strong>) tested "crazy" buyers for impractical EV: low range, no charging, odd looks.
  a. Funded capex for <strong>Model S/3/Y</strong>, but primarily searched adopter preferences.
  b. Result: <strong>Model Y</strong> prioritizes <strong>acceleration</strong> (<strong>under 3 seconds 0-60</strong>) and tech over comfort/suspension—echoing early fans, not mass market.
- Alternate paths possible: Plush early adopters might yield different cars today.

## Conclusion: Embrace Evolution Over Perfection
- Build a <strong>minimum evolvable product</strong> to let <strong>early users</strong> guide the <strong>phylogenetic journey</strong> from amoeba to maturity.
- <strong>Action</strong>: Search personally for desperate pioneers, charge early, iterate fast—your starting users define the endgame.
`.trim();

/**
 * 👉 Full summary payload (summary text, keywords, etc.). summary uses MOCK_SUMMARY above; edit keywords here if needed.
 */
const MOCK_VIDEO_SUMMARY: VideoSummaryView = {
  id: 'tutorial-summary-id',
  videoId: TUTORIAL_YOUTUBE_PROPERTIES.youtubeId,
  language: 'en',
  summary: MOCK_SUMMARY,
  keywords: [
    "early adopters",
    "minimum evolvable product",
    "search problem",
    "burning problems",
    "phylogenetic tree",
    "charge real money",
    "path-dependent evolution",
    "first 10 users",
    "launch early",
    "sharper feedback"
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface MockSummarySectionProps {
  currentStepIndex: number;
}

export function MockSummarySection({
  currentStepIndex,
}: MockSummarySectionProps) {
  const summaryContentDeps = useSummaryContentDeps();
  const {
    tutorialState,
    updateTutorialState,
    completeCurrentStep,
    currentStep,
  } = useTutorialDialogContext();

  const selectedLanguage =
    (tutorialState.selectedLanguage as string) ?? 'en';
  const hasSummary = Boolean(tutorialState.hasSummary);

  const setSelectedLanguage = (lang: string) => {
    updateTutorialState({ selectedLanguage: lang });
    if (lang === 'en') {
      setTimeout(() => completeCurrentStep(), 200);
    }
  };

  const handleExtractSummary = async () => {
    updateTutorialState({ hasSummary: true });
    setTimeout(() => completeCurrentStep(), 300);
  };

  return (
    <SummarySectionContainer>
      <Box className="mb-8 flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <InteractionGuard selector="language-selector">
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const selector = lang === 'en' ? 'language-english' : `language-${lang}`;
                return (
                  <InteractionGuard key={lang} selector={selector}>
                    <SelectItem
                      value={lang}
                      data-tutorial={selector}
                      onPointerDown={
                        lang === 'en' && currentStep?.id === 'select-english'
                          ? () => setTimeout(() => completeCurrentStep(), 150)
                          : undefined
                      }
                    >
                      <Box className="flex items-center justify-between w-full">
                        {getLanguageName(lang)}
                      </Box>
                    </SelectItem>
                  </InteractionGuard>
                );
              })}
            </SelectContent>
          </Select>
        </InteractionGuard>
      </Box>

      {hasSummary ? (
        <InteractionGuard selector="summary-content">
          <Box data-tutorial="summary-content">
            <SummaryContent
              summary={MOCK_VIDEO_SUMMARY.summary}
              keywords={MOCK_VIDEO_SUMMARY.keywords}
              deps={summaryContentDeps}
            />
          </Box>
        </InteractionGuard>
      ) : (
        <>
          <Box className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
            <p className="text-center text-sm text-foreground whitespace-pre-line">
              <Info
                aria-hidden="true"
                className="-mt-0.5 me-3 inline-flex opacity-60"
                size={16}
              />
              No summary available for this language. Extract summary from
              YouTube video to view the summary.
            </p>
          </Box>
          <InteractionGuard selector="extract-summary-button">
            <Box className="mt-4">
              <ExtractSummaryButton
                language={selectedLanguage}
                onExtractSummary={handleExtractSummary}
                isLoading={false}
                disabled={false}
              />
            </Box>
          </InteractionGuard>
        </>
      )}
    </SummarySectionContainer>
  );
}
