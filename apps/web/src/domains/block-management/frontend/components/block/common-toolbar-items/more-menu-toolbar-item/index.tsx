/**
 * More Menu Toolbar Item Component
 *
 * Container Component: Handles business logic and data fetching
 * - Uses hooks to fetch data and handle business logic
 * - Passes data to Presentational component as Props
 */

'use client';

import { MoreMenuView } from './components/more-menu-view';
import type { MoreMenuToolbarItemProps } from './core/types';
import { useMoreMenu } from './core/use-more-menu';

/**
 * Container Component: More Menu Toolbar Item
 *
 * - Handles business logic via hooks
 * - Fetches pageId from context
 * - Passes data to Presentational component
 */
export function MoreMenuToolbarItem(
  props: MoreMenuToolbarItemProps
): React.JSX.Element {
  // Get business logic and UI state from hooks
  const { business } = useMoreMenu(props);

  // Render Presentational component with props
  return (
    <MoreMenuView
      blockMountId={props.blockMountId}
      business={business}
      parentBlockMountId={props.parentBlockMountId}
    />
  );
}
