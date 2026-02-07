import { createClient } from "supabase";

const BATCH_SIZE = 20;
const VISIBILITY_TIMEOUT = 300; // 5 minutes
const API_URL = Deno.env.get("NEXT_PUBLIC_APP_URL")!;
const API_SECRET = Deno.env.get("INTERNAL_API_SECRET")!;

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

    // 3. Fire-and-forget: call API Route (no await)
    rows.forEach((row) => {
      fetch(`${API_URL}/api/youtube/process-summary-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": API_SECRET,
        },
        body: JSON.stringify({
          jobId: row.message.jobId,
          msgId: row.msg_id,
        }),
      });
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
