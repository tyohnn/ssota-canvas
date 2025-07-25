import { CanvasPage } from "@/domains/canvas/components/canvas-page";

interface CanvasWorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CanvasWorkspacePageRoute({
  params,
  searchParams,
}: CanvasWorkspacePageProps) {
  const { workspaceId } = await params;
  const searchParamsResolved = await searchParams;

  return (
    <div className="h-screen w-full">
      <CanvasPage workspaceId={workspaceId} className="h-full w-full" />
    </div>
  );
}
