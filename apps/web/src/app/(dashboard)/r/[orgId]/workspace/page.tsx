/**
 * Render a centered workspace dashboard page with a Korean heading and subtitle.
 *
 * @returns A JSX element containing a centered heading "대시보드" and subtitle "워크스페이스 페이지입니다." with layout and typography utility classes.
 */
export default function WorkspacePage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">대시보드</h1>
        <p className="text-lg text-gray-600">워크스페이스 페이지입니다.</p>
      </div>
    </div>
  );
}