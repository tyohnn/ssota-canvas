/**
 * Workspace Management Frontend Components
 *
 * Story-002: Workspace 생성 및 수정
 */

// Shared Components
export { IconPicker, WorkspaceIcon } from './shared/icon-picker';

// Workspace Management Components
export { CreateWorkspaceDialog } from './workspace/create-workspace-dialog';
export { WorkspaceSettingsDialog } from './workspace/workspace-settings-dialog';
export { WorkspaceContextMenu } from './workspace/workspace-context-menu';

// Sidebar Components
export { WorkspaceItem } from './sidebar/workspace-item';
export { WorkspacePageTree } from './sidebar/workspace-page-tree';
export { WorkspaceSidebarContent } from './sidebar/workspace-sidebar-content';
export { FavoritePageList } from './sidebar/favorite-page-list';

// Page Viewer Components
export {
  PageViewer,
  PageHeader,
  WorkspacePageHeader,
  PageSkeleton,
  AccessDeniedPage,
} from './page-viewer';
