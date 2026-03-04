/**
 * Drive Summary Tab
 *
 * Uses useSourceSummarySection with Drive deps (no Canvas context).
 */

'use client';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { useSourceSummarySectionDriveDeps } from '@/domains/drive/frontend/adapters/source-tab-drive-deps';
import { SummarySectionView } from '@workspace/editor-panel';
import { useSourceSummarySection } from '@/domains/source-management/frontend/adapters/source-summary';
import {
  getLanguageName,
  orderLanguagesWithPreferenceFirst,
  useSummaryContentDeps,
} from '@/domains/editor-panel/frontend/adapters/summary-content-deps';

export interface DriveSummaryTabProps {
  blockId: string;
  blockData: DriveBlockData | undefined;
}

function getSourceSummaryAccessLanguages(
  properties: unknown
): string[] | undefined {
  if (!properties || typeof properties !== 'object') return undefined;
  const p = properties as Record<string, unknown>;
  const v = p.sourceSummaryAccessLanguages;
  if (Array.isArray(v) && v.every((x): x is string => typeof x === 'string')) {
    return v;
  }
  return undefined;
}

export function DriveSummaryTab({
  blockId,
  blockData,
}: DriveSummaryTabProps) {
  const blockSlug = blockData?.blockSlug ?? blockData?.blockId ?? blockId;
  const sourceId = blockData?.sourceId;
  const sourceSummaryAccessLanguagesFromProperties = blockData?.properties
    ? getSourceSummaryAccessLanguages(blockData.properties)
    : undefined;

  const summaryDeps = useSourceSummarySectionDriveDeps(blockData);
  const business = useSourceSummarySection(
    {
      blockSlug,
      sourceId,
      sourceSummaryAccessLanguagesFromProperties,
    },
    summaryDeps
  );

  const summaryContentDeps = useSummaryContentDeps();
  const orderedLanguages = orderLanguagesWithPreferenceFirst(
    business.userPreferredLanguage
  );

  if (!sourceId) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Add a source to enable summarization.
      </p>
    );
  }

  return (
    <SummarySectionView
      summaries={business.summaries}
      availableLanguages={business.availableLanguages}
      selectedLanguage={business.selectedLanguage}
      setSelectedLanguage={business.setSelectedLanguage}
      currentSummary={business.currentSummary}
      isLoading={business.isLoading}
      error={business.error}
      onExtractSummary={business.handleExtractSummary}
      isExtracting={business.isExtracting}
      hasAccessForSelectedLanguage={business.hasAccessForSelectedLanguage}
      sourceSummaryAccessLanguages={business.sourceSummaryAccessLanguages}
      readonly={business.readonly}
      userPreferredLanguage={business.userPreferredLanguage}
      orderedLanguages={orderedLanguages}
      getLanguageName={getLanguageName}
      summaryContentDeps={summaryContentDeps}
    />
  );
}
