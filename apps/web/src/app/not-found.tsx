/**
 * Global Not Found Page
 *
 * 전체 앱에서 발생하는 404 에러를 처리하는 페이지
 * SSOTA의 캔버스 철학을 반영한 디자인
 *
 * 두 가지 버전 사용 가능:
 * - NotFoundCanvas: SVG 기반 (가벼움)
 * - NotFoundCanvasReactFlow: ReactFlow 기반 (실제 블록 사용)
 */
import { MainHeader } from './(main)/_components/MainHeader';
import { NotFoundCanvasReactFlow } from './(main)/_components/not-found/NotFoundCanvasReactFlow';

export default function NotFound() {
  return (
    <div className="flex flex-col h-screen">
      <MainHeader />
      <NotFoundCanvasReactFlow />
    </div>
  );
}
