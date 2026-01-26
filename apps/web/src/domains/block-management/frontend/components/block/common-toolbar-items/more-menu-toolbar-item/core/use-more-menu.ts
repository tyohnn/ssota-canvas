import { useReactFlow } from '@xyflow/react';

import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import {
  useCanvasBlockLifecycle,
  useCanvasModeContext,
} from '@/domains/canvas-management/frontend/hooks';

import type {
  DomainDependencies,
  MoreMenuToolbarItemProps,
  UseMoreMenuReturn,
} from './types';
import { useMoreMenuBusiness } from './use-more-menu.business';
import { useMoreMenuUI } from './use-more-menu.ui';

/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useMoreMenu(
  props: MoreMenuToolbarItemProps,
  // optional injection
  canvasMetadataOverride?: CanvasMetadata
): UseMoreMenuReturn {
  const { pageId } = useCanvasMetadata(canvasMetadataOverride);

  // 1. Gather External Dependencies
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
  });
  const canvasMode = useCanvasModeContext();
  const { deleteElements, getNodes } = useReactFlow();
  const getNode = (id: string) => getNodes().find(n => n.id === id);

  // 2. Bundle Dependencies into semantic objects (Separated by concern)
  const domainDependencies: DomainDependencies = {
    blockLifecycle: {
      duplicateBlockAndMount: blockLifecycle.duplicateBlockAndMount,
      removeNodeFromGroup: blockLifecycle.removeNodeFromGroup,
    },
    canvasMode: {
      enterBlockEditingMode: canvasMode.enterBlockEditingMode,
      exitToDefaultMode: canvasMode.exitToDefaultMode,
    },
    reactFlow: {
      deleteElements,
      getNode,
    },
  };

  // 3. Inject into UI State Hook (Designer area)
  const uiState = useMoreMenuUI();

  // 4. Inject into Business Logic Hook (Engineer area)
  const business = useMoreMenuBusiness(props, domainDependencies);

  // 5. Compose and Return
  return {
    business,
    uiState,
  };
}
