/**
 * Workspace Management Actions - 공통 유틸리티 함수
 */

import type { Page } from '../shared/entities/page.entity';
import type { PageTreeNodeDTO } from '../shared/dtos';

/**
 * Page Entity 배열 → PageTreeNodeDTO 변환 (재귀 구조)
 *
 * @param pages - Page Entity 배열 (flat, depth/order 정렬됨)
 * @returns PageTreeNodeDTO 배열 (재귀 트리)
 */
export function buildPageTreeDTO(pages: Page[]): PageTreeNodeDTO[] {
  const pageMap = new Map<string, PageTreeNodeDTO>();
  const rootNodes: PageTreeNodeDTO[] = [];

  // 1. 모든 페이지를 DTO로 변환하고 Map에 저장
  for (const page of pages) {
    const dto: PageTreeNodeDTO = {
      id: page.pageId.value,
      title: page.title,
      icon: page.icon,
      children: [],
      depth: page.depth,
      isFavorite: false, // TODO: page_favorites 테이블 조인 필요
      lastModified:
        page.updatedAt instanceof Date
          ? page.updatedAt.toISOString()
          : page.updatedAt,
      parentId: page.parentId?.value || null,
      order: page.order,
    };
    pageMap.set(page.pageId.value, dto);
  }

  // 2. 부모-자식 관계 구성 (재귀 트리)
  for (const page of pages) {
    const dto = pageMap.get(page.pageId.value)!;
    if (page.parentId) {
      const parent = pageMap.get(page.parentId.value);
      if (parent) {
        parent.children.push(dto);
      } else {
        // 부모가 없으면 root로 취급 (안전장치)
        rootNodes.push(dto);
      }
    } else {
      // 최상위 페이지 (parentId === null)
      rootNodes.push(dto);
    }
  }

  return rootNodes;
}
