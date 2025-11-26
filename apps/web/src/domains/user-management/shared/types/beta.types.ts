/**
 * Beta Access Management Types
 */

import type { BetaStatus } from '@/db/schema';

/**
 * Beta Application Form Data
 */
export interface BetaApplicationData {
  name?: string;
  organization?: string;
  purpose?: string;
  use_case?: string;
}

/**
 * Purpose Options
 */
export type PurposeOption =
  | 'personal'
  | 'work'
  | 'education'
  | 'research'
  | 'testing'
  | 'other';

/**
 * Use Case Options
 */
export type UseCaseOption =
  | 'product_management'
  | 'design'
  | 'development'
  | 'marketing'
  | 'content_creation'
  | 'project_management'
  | 'other';

/**
 * Beta Status Response
 */
export interface BetaStatusResponse {
  beta_status: BetaStatus;
  beta_application: BetaApplicationData | null;
  beta_applied_at: string | null;
  beta_approved_at: string | null;
}

/**
 * User Beta Info
 */
export interface UserBetaInfo {
  userId: string;
  betaStatus: BetaStatus;
  betaApplication: BetaApplicationData | null;
  betaAppliedAt: Date | null;
  betaApprovedAt: Date | null;
  betaApprovedBy: string | null;
}
