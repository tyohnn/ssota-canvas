import { createClient } from "supabase";

const BATCH_SIZE = 20;
const VISIBILITY_TIMEOUT = 60; // 1 min — extract+summary 처리에 충분, 실패 시 재시도는 이 시간 후
const API_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";
const API_SECRET = Deno.env.get("INTERNAL_API_SECRET") ?? "";
// Preview(dev) 배포에 Vercel Deployment Protection이 켜져 있으면, Vercel의 Protection Bypass for Automation 시크릿을 여기 넣고 Supabase Secrets에 설정.
const VERCEL_BYPASS = Deno.env.get("VERCEL_PROTECTION_BYPASS_SECRET") ?? "";

interface QueueMessage {
  msg_id: number;
  message: {
    jobId: string;
    blockId?: string;
    sourceId?: string;
    language?: string;
  };
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Read messages from pgmq (visibility_timeout, other consumers won't see them)
    const { data: messages, error: readError } = await supabase
      .schema("pgmq_public")
      .rpc("read", {
        queue_name: "source_job_queue",
        sleep_seconds: VISIBILITY_TIMEOUT,
        n: BATCH_SIZE,
      });

    if (readError) {
      console.error("pgmq read error (source_job_queue):", readError);
      return new Response(
        JSON.stringify({ processed: 0, error: readError.message }),
        { status: 200 }
      );
    }

    const rows = (messages ?? []) as QueueMessage[];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }));
    }

    const jobUrl = `${API_URL}/api/source/process-job`;

    // 2. Update source_jobs to processing
    const jobIds = rows.map((row) => row.message.jobId);
    await supabase
      .from("source_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .in("id", jobIds);

    // 3. Call API Route
    const appHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Secret": API_SECRET,
    };
    if (VERCEL_BYPASS) {
      appHeaders["x-vercel-protection-bypass"] = VERCEL_BYPASS;
    }
    await Promise.allSettled(
      rows.map((row) =>
        fetch(jobUrl, {
          method: "POST",
          headers: appHeaders,
          body: JSON.stringify({
            jobId: row.message.jobId,
            msgId: row.msg_id,
          }),
        })
      )
    );

    return new Response(JSON.stringify({ dispatched: rows.length }));
  } catch (error) {
    console.error("Error processing source_job_queue:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
});
