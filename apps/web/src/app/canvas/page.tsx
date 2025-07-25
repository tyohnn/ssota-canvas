import { CanvasPage } from "@/domains/canvas/components/canvas-page";

interface CanvasPageProps {
  params: Promise<{ workspaceId?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CanvasPageRoute({
  params,
  searchParams,
}: CanvasPageProps) {
  const { workspaceId } = await params;
  const searchParamsResolved = await searchParams;

  // Default workspace ID if not provided
  const defaultWorkspaceId = workspaceId || "default-workspace";

  return (
    <div className="h-screen w-full">
      <CanvasPage workspaceId={defaultWorkspaceId} className="h-full w-full" />
    </div>
  );
}
