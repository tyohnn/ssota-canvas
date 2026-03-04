/**
 * SourceJob → StatusJob 변환 유틸
 *
 * useMultiSourceJobRealtime onJobUpdate 콜백 내부에서 사용.
 * AIActionProvider, DriveSourceJobStatusProvider 공통.
 */

import type { SourceJob } from '@/domains/source-management/frontend/hooks';
import type { StatusJob } from '../types/status-job.types';

export const AUTO_SUMMARY_TODO_ID = 'auto-summary';

const LANGUAGE_DISPLAY: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
};

export function languageCodeToDisplayName(code: string): string {
  return LANGUAGE_DISPLAY[code] ?? code;
}

/** Task 제목: "Auto Summary in Korean" 형식 */
export function getAutoSummaryTaskTitle(lang: string): string {
  return `Auto Summary in ${languageCodeToDisplayName(lang)}`;
}

export function sourceJobStatusToStatusJobStatus(
  s: string
): StatusJob['status'] {
  if (s === 'pending' || s === 'processing') return 'running';
  if (s === 'completed') return 'completed';
  if (s === 'failed') return 'failed';
  return 'running';
}

export function getTaskDescriptionFromSourceJob(raw: SourceJob): string {
  if ('current_step' in raw && raw.current_step === 'extracting') {
    return 'Extracting script...';
  }
  if ('current_step' in raw && raw.current_step === 'summarizing') {
    return 'Generating summary...';
  }
  return 'Generating summary...';
}

export interface CreateStatusJobPatchParams {
  raw: SourceJob;
  existingJob: Pick<
    StatusJob,
    'id' | 'type' | 'sourceBlockId' | 'templateName' | 'resourceTitle' | 'language' | 'createdAt'
  >;
}

/**
 * SourceJob Realtime 이벤트로부터 StatusJob patch 생성
 */
export function createStatusJobPatchFromSourceJob({
  raw,
  existingJob,
}: CreateStatusJobPatchParams): Partial<StatusJob> & Pick<StatusJob, 'id' | 'sourceBlockId' | 'createdAt'> {
  const status = sourceJobStatusToStatusJobStatus(raw.status);
  const taskDesc = getTaskDescriptionFromSourceJob(raw);
  const lang = raw.language ?? existingJob.language ?? 'en';
  const taskTitle = getAutoSummaryTaskTitle(lang);

  return {
    id: existingJob.id,
    type: existingJob.type,
    status,
    error:
      raw.error_message && status === 'failed'
        ? new Error(raw.error_message)
        : null,
    tasks:
      status === 'running' || status === 'pending'
        ? [
            {
              id: AUTO_SUMMARY_TODO_ID,
              title: taskTitle,
              description: taskDesc,
              status: 'pending' as const,
            },
          ]
        : [
            {
              id: AUTO_SUMMARY_TODO_ID,
              title: taskTitle,
              description:
                status === 'failed'
                  ? raw.error_message ?? 'Failed'
                  : 'Summary ready',
              status: 'completed' as const,
            },
          ],
    sourceBlockId: existingJob.sourceBlockId,
    templateName: existingJob.templateName,
    resourceTitle: existingJob.resourceTitle,
    language: lang,
    createdAt: existingJob.createdAt,
  };
}
