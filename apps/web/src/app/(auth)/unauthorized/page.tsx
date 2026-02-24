/**
 * Unauthorized Page
 *
 * 404 페이지와 동일한 캔버스 스타일, 빨간색(primary) 블록
 * 권한 없음 / 인증 만료 시 표시
 */
import { MainHeader } from '@/app/(main)/_components/MainHeader';

import { UnauthorizedCanvasReactFlow } from '@/app/(main)/_components/not-found/UnauthorizedCanvasReactFlow';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col h-screen">
      <MainHeader />
      <UnauthorizedCanvasReactFlow />
    </div>
  );
}
