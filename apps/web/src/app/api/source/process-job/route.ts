import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { config } from '@/config';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleSourceJobRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { DrizzleSourceSummaryRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-summary.repository';
import { DrizzleSourceActionTransactionRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-action-transaction.repository';
import { processSourceJobService } from '@/domains/source-management/backend/services/source-job';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Internal-Secret');
  if (secret !== config.app.internalApiSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const sourceJobRepository = new DrizzleSourceJobRepository();
  const jobAggregate = await sourceJobRepository.findById(jobId);

  if (!jobAggregate) {
    if (msgId != null) {
      await supabase.schema('pgmq_public').rpc('delete', {
        queue_name: 'source_job_queue',
        message_id: msgId,
      });
    }
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobAggregate.getJob();

  const archiveQueueMessage = async (msgIdNum: number) => {
    await supabase.schema('pgmq_public').rpc('archive', {
      queue_name: 'source_job_queue',
      message_id: msgIdNum,
    });
  };
  const deleteQueueMessage = async (msgIdNum: number) => {
    await supabase.schema('pgmq_public').rpc('delete', {
      queue_name: 'source_job_queue',
      message_id: msgIdNum,
    });
  };

  const result = await processSourceJobService(
    {
      jobId,
      blockId: job.blockId.value,
      sourceId: job.sourceId.value,
      orgId: job.orgId.value,
      language: job.language,
      msgId: msgId ?? undefined,
    },
    {
      sourceJobRepository,
      blockRepository: new DrizzleBlockRepository(),
      sourceRepository: new DrizzleSourceRepository(),
      sourceSummaryRepository: new DrizzleSourceSummaryRepository(),
      sourceActionTransactionRepository:
        new DrizzleSourceActionTransactionRepository(),
      archiveQueueMessage,
      deleteQueueMessage,
    }
  );

  if ('notFound' in result && result.notFound) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if ('err' in result && result.err) {
    console.error('[process-source-job] Error:', result.err);
    return NextResponse.json({ error: result.err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
