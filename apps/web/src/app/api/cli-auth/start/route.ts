import { NextRequest, NextResponse } from "next/server";
import { startCliAuth } from "@/domains/cli-auth/actions/cli-auth.action";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { workspaceId } = body ?? {};
  const { code, expiresAt } = await startCliAuth(workspaceId);

  const url = new URL(req.url);
  url.pathname = "/(auth)/cli";
  url.searchParams.set("code", code);

  return NextResponse.json({
    code,
    verificationUrl: url.toString(),
    expiresAt: expiresAt.toISOString(),
  });
}
