import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { approveCliAuth } from "@/domains/cli-auth/actions/cli-auth.action";

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const code = searchParams.code?.trim().toUpperCase();
  if (!code) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">CLI 인증</h1>
        <p className="text-sm text-muted-foreground mt-2">
          유효한 코드가 없습니다. CLI에서 init을 다시 실행하세요.
        </p>
      </div>
    );
  }

  // Approve through action (uses RLS/Clerk)
  try {
    await approveCliAuth(code);
  } catch (e) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">CLI 인증</h1>
        <p className="text-sm text-red-600 mt-2">
          승인 처리 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">CLI 인증 완료</h1>
      <p className="text-sm text-muted-foreground mt-2">
        터미널로 돌아가세요. 교환을 진행 중입니다.
      </p>
      <p className="text-sm mt-4">코드: {code}</p>
    </div>
  );
}
