import { createClient } from "supabase";

const BATCH_SIZE = 20;
const VISIBILITY_TIMEOUT = 60; // 1.5 min — 요약 처리에 충분, 실패 시 재시도는 이 시간 후
const API_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";
const API_SECRET = Deno.env.get("INTERNAL_API_SECRET") ?? "";

function logEnv() {
  let apiUrlHost = "(empty)";
  try {
    if (API_URL) apiUrlHost = new URL(API_URL).hostname;
  } catch {
    apiUrlHost = "(invalid)";
  }
  console.log("[process-summary-queue] env check:", {
    hasApiUrl: !!API_URL,
    apiUrlHost,
    hasApiSecret: !!API_SECRET,
    apiSecretLength: API_SECRET?.length ?? 0,
  });
}

interface QueueMessage {
  msg_id: number;
  message: {
    jobId: string;
    blockId?: string;
    youtubeId?: string;
    language?: string;
  };
}


Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Read messages from pgmq (visibility_timeout = 300s, other consumers won't see them)
    const { data: messages, error: readError } = await supabase
      .schema("pgmq_public")
      .rpc("read", {
        queue_name: "summary_queue",
        sleep_seconds: VISIBILITY_TIMEOUT,
        n: BATCH_SIZE,
      });

    if (readError) {
      console.error("pgmq read error:", readError);
      return new Response(JSON.stringify({ processed: 0, error: readError.message }), {
        status: 200,
      });
    }

    const rows = (messages ?? []) as QueueMessage[];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }));
    }

    logEnv();
    const jobUrl = `${API_URL}/api/youtube/process-summary-job`;
    console.log("[process-summary-queue] calling app API:", { url: jobUrl, count: rows.length });

    // 2. Update summary_jobs to processing
    const jobIds = rows.map((row) => row.message.jobId);
    await supabase
      .schema("youtube_app_space")
      .from("summary_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .in("id", jobIds);

    // 3. Call API Route and log response for debugging (e.g. 401)
    const results = await Promise.allSettled(
      rows.map((row) =>
        fetch(jobUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": API_SECRET,
          },
          body: JSON.stringify({
            jobId: row.message.jobId,
            msgId: row.msg_id,
          }),
        })
      )
    );
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        console.log("[process-summary-queue] app API response:", {
          jobId: rows[i]?.message.jobId,
          status: r.value.status,
          statusText: r.value.statusText,
        });
      } else {
        console.error("[process-summary-queue] app API request failed:", {
          jobId: rows[i]?.message.jobId,
          reason: String(r.reason),
        });
      }
    });

    return new Response(JSON.stringify({ dispatched: rows.length }));
  } catch (error) {
    console.error("Error processing queue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
