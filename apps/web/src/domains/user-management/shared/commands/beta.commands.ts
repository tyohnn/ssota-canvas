/**
 * Beta Access Management Commands
 */

import type { BetaApplicationData } from '../types/beta.types';

/**
 * Submit Beta Application Command
 */
export interface SubmitBetaApplicationCommand {
  userId: string;
  applicationData: BetaApplicationData;
}

/**
 * Approve Beta Application Command
 */
export interface ApproveBetaApplicationCommand {
  userId: string;
  approvedBy: string;
}
