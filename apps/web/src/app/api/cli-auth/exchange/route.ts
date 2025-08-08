import { NextRequest, NextResponse } from "next/server";
import { exchangeCliAuth } from "@/domains/cli-auth/actions/cli-auth.action";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code: string | undefined = body?.code;
  if (!code)
    return NextResponse.json({ error: "code required" }, { status: 400 });

  const result = await exchangeCliAuth(code);
  if (!result.success) {
    const status =
      result.error === "not found"
        ? 404
        : result.error === "expired"
          ? 410
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({
    secret: result.secret,
    workspaceId: result.workspaceId,
    userId: result.userId,
  });
}
