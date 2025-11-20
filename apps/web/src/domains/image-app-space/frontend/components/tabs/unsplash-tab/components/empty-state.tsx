'use client';

/**
 * Empty State Component
 *
 * 검색 결과가 없을 때 표시
 */
export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">No results found</p>
        <p className="text-sm">Try a different search term</p>
      </div>
    </div>
  );
}
