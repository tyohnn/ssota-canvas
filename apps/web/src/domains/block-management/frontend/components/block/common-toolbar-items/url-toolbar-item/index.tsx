/**
 * URL Toolbar Item Component
 *
 * Container Component: Handles business logic and data fetching
 * - Uses hooks to fetch data and handle business logic
 * - Passes data to Presentational component as Props
 */

'use client';

import { UrlToolbarItemView } from './components/url-toolbar-item-view';
import type { UrlToolbarItemProps } from './core/types';
import { useUrlToolbarItem } from './core/use-url-toolbar-item';

/**
 * URL Toolbar Item (공통)
 *
 * URL 편집을 위한 공통 툴바 아이템
 * - Popover로 URL 입력 폼 표시
 * - URL 변경 시 메타데이터 자동 fetch
 * - Link, YouTube 등 URL 기반 블록에서 재사용 가능
 */
export function UrlToolbarItem(props: UrlToolbarItemProps): React.JSX.Element {
  // Get business logic and UI state from hooks
  const { uiState, business, handleSubmit } = useUrlToolbarItem(props);

  // Render Presentational component with props
  return (
    <UrlToolbarItemView
      icon={props.icon}
      label={props.label}
      placeholder={props.placeholder}
      disabled={props.disabled}
      uiState={uiState}
      business={business}
      handleSubmit={handleSubmit}
    />
  );
}
