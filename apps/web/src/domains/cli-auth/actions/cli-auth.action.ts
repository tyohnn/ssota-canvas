"use server";

import {
  cliAuthCodes,
  cliSecrets,
  createClerkDrizzleSupabaseClient,
  createSupabaseAdminClient,
} from "@/db";
import { eq } from "drizzle-orm";
import { kvCliAuth } from "@/lib/kv";
import { signJwtHS256 } from "@/lib/jwt";
import { config } from "@/config";
import { rateLimit } from "@/lib/rate-limit";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function startCliAuth(workspaceId?: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const { admin } = createSupabaseAdminClient();
  const [row] = await admin
    .insert(cliAuthCodes)
    .values({
      code,
      workspace_id: workspaceId ?? null,
      status: "pending",
      expires_at: expiresAt,
    })
    .returning();
  return { code, expiresAt } as const;
}

export async function approveCliAuth(code: string) {
  const rls = await createClerkDrizzleSupabaseClient();
  const rawSecret = Buffer.from(
    crypto.getRandomValues(new Uint8Array(32))
  ).toString("base64");
  const updated = await rls.rls(async (tx) => {
    const [row] = await tx
      .select()
      .from(cliAuthCodes)
      .where(eq(cliAuthCodes.code, code))
      .limit(1);
    if (!row) throw new Error("code not found");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("code expired");
    if (row.status !== "pending") throw new Error("invalid status");

    const [updatedRow] = await tx
      .update(cliAuthCodes)
      .set({ status: "approved", approved_at: new Date() })
      .where(eq(cliAuthCodes.id, row.id))
      .returning();
    return updatedRow;
  });
  // Store secret in KV for 5 minutes TTL
  kvCliAuth.set(`cli-secret:${code.toUpperCase()}`, rawSecret, 5 * 60 * 1000);
  return { success: true as const };
}

export async function exchangeCliAuth(code: string) {
  const { admin } = createSupabaseAdminClient();
  // Basic IP/Code rate-limit: 5 req / 10s per code
  const rlKey = `exchange:${code.toUpperCase()}`;
  if (!rateLimit(rlKey, 5, 10_000)) {
    return { success: false as const, error: "rate_limited" } as const;
  }
  const [row] = await admin
    .select()
    .from(cliAuthCodes)
    .where(eq(cliAuthCodes.code, code.toUpperCase()))
    .limit(1);
  if (!row) return { success: false as const, error: "not found" } as const;
  if (row.status !== "approved")
    return { success: false as const, error: "not approved" } as const;
  if (new Date(row.expires_at).getTime() < Date.now())
    return { success: false as const, error: "expired" } as const;
  if (!row.user_id || !row.workspace_id)
    return { success: false as const, error: "not ready" } as const;

  // Increment attempts and enforce limits
  const now = new Date();
  const attemptRow = await admin
    .update(cliAuthCodes)
    .set({ attempt_count: (row.attempt_count ?? 0) + 1, last_attempt_at: now })
    .where(eq(cliAuthCodes.id, row.id))
    .returning();
  const attempts = attemptRow?.[0]?.attempt_count ?? 0;
  if (attempts > 10)
    return { success: false as const, error: "too_many_attempts" } as const;

  const rawSecret = kvCliAuth.get(`cli-secret:${code.toUpperCase()}`);
  if (!rawSecret)
    return { success: false as const, error: "not_ready" } as const;

  const enc = new TextEncoder();
  const hashArray = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(rawSecret)))
  );
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const inserted = await admin
    .insert(cliSecrets)
    .values({
      user_id: row.user_id,
      workspace_id: row.workspace_id,
      secret_hash: hashHex,
    })
    .returning();
  const secret = inserted[0];
  if (!secret) throw new Error("secret insert failed");

  await admin
    .update(cliAuthCodes)
    .set({
      status: "exchanged",
      exchanged_at: new Date(),
      secret_id: secret.id,
    })
    .where(eq(cliAuthCodes.id, row.id));

  // Clear KV after successful exchange
  kvCliAuth.delete(`cli-secret:${code.toUpperCase()}`);

  // Return secret and short-lived signed token (60s)
  const signed = await signJwtHS256(
    {
      kind: "cli-exchange",
      workspaceId: row.workspace_id,
      userId: row.user_id,
    },
    // Use database URL as entropy base (fallback to random) – ideally move to dedicated secret
    config.database.url || rawSecret,
    60
  );

  return {
    success: true as const,
    secret: rawSecret,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    token: signed,
  } as const;
}
