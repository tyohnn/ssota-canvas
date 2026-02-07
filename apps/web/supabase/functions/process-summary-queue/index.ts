import { createClient } from "supabase";

const BATCH_SIZE = 20;
const VISIBILITY_TIMEOUT = 60; // 1.5 min — 요약 처리에 충분, 실패 시 재시도는 이 시간 후
const API_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";
const API_SECRET = Deno.env.get("INTERNAL_API_SECRET") ?? "";
// Preview(dev) 배포에 Vercel Deployment Protection이 켜져 있으면, Vercel의 Protection Bypass for Automation 시크릿을 여기 넣고 Supabase Secrets에 설정.
const VERCEL_BYPASS = Deno.env.get("VERCEL_PROTECTION_BYPASS_SECRET") ?? "";

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
    vercelBypassSet: !!VERCEL_BYPASS,
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
    const appHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Secret": API_SECRET,
    };
    if (VERCEL_BYPASS) {
      appHeaders["x-vercel-protection-bypass"] = VERCEL_BYPASS;
    }
    const results = await Promise.allSettled(
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
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const row = rows[i];
      if (r.status === "fulfilled") {
        const res = r.value;
        console.log("[process-summary-queue] app API response:", {
          jobId: row?.message.jobId,
          status: res.status,
          statusText: res.statusText,
        });
        if (res.status === 401) {
          try {
            const text = await res.text();
            console.log("[process-summary-queue] 401 response body (앱 쪽 원인):", text);
          } catch (_) {
            /* ignore */
          }
        }
      } else {
        console.error("[process-summary-queue] app API request failed:", {
          jobId: row?.message.jobId,
          reason: String(r.reason),
        });
      }
    }

    return new Response(JSON.stringify({ dispatched: rows.length }));
  } catch (error) {
    console.error("Error processing queue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
