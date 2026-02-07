import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { config } from '@/config';
import { DrizzleActionTransactionRepository } from '@/domains/youtube-app-space/backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleSummaryJobRepository } from '@/domains/youtube-app-space/backend/repositories/implementations/drizzle-summary-job.repository';
import { DrizzleVideoRepository } from '@/domains/youtube-app-space/backend/repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '@/domains/youtube-app-space/backend/repositories/implementations/drizzle-video-summary.repository';
import {
  processSummaryJobService,
  type ProcessSummaryJobDeps,
} from '@/domains/youtube-app-space/backend/services/summary';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Internal-Secret');
  const authOk = secret === config.app.internalApiSecret;
  console.log('[process-summary-job] auth check:', {
    headerPresent: secret !== null,
    headerLength: secret?.length ?? 0,
    expectedSecretSet: !!config.app.internalApiSecret,
    authOk,
  });
  if (!authOk) {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview';
    const body: { error: string; _debug?: { expectedSecretSet: boolean } } = { error: 'Unauthorized' };
    if (isDev) body._debug = { expectedSecretSet: !!config.app.internalApiSecret };
    return NextResponse.json(body, { status: 401 });
  }

  let body: { jobId?: string; msgId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { jobId, msgId } = body;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );

  const deps: ProcessSummaryJobDeps = {
    summaryJobRepository: new DrizzleSummaryJobRepository(),
    blockRepository: new DrizzleBlockRepository(),
    videoRepository: new DrizzleVideoRepository(),
    videoSummaryRepository: new DrizzleVideoSummaryRepository(),
    actionTransactionRepository: new DrizzleActionTransactionRepository(),
    archiveQueueMessage: async (msgIdNum) => {
      await supabase.schema('pgmq_public').rpc('archive', {
        queue_name: 'summary_queue',
        message_id: msgIdNum,
      });
    },
    deleteQueueMessage: async (msgIdNum) => {
      await supabase.schema('pgmq_public').rpc('delete', {
        queue_name: 'summary_queue',
        message_id: msgIdNum,
      });
    },
  };

  const result = await processSummaryJobService({ jobId, msgId }, deps);

  if ('notFound' in result && result.notFound) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if ('err' in result && result.err) {
    console.error('[process-summary-job] Error:', result.err);
    return NextResponse.json({ error: result.err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
