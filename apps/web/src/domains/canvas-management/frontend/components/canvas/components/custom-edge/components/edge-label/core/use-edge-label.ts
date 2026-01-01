import { useCallback } from 'react';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasEdgeManagement } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-management';

import type {
  DomainDependencies,
  EdgeLabelBusinessLogic,
  EdgeLabelHookProps,
  UseEdgeLabelReturn,
} from './types';
import { useEdgeLabelBusiness } from './use-edge-label.business';
import { useEdgeLabelUI } from './use-edge-label.ui';

/**
 * Edge Label Hook
 *
 * Integrates UI state and business logic for edge label editing.
 *
 * @param props - Label configuration and required parameters
 * @param [businessLogic] - Optional business logic injection
 *   - **Production**: Uses default business logic when omitted (includes API calls)
 *   - **Test/Mock**: Inject mock business logic for unit testing
 *   - **Storybook**: Inject mock for no-code environments for use in design systems
 */
export function useEdgeLabel(
  props: EdgeLabelHookProps,
  businessLogic?: EdgeLabelBusinessLogic
): UseEdgeLabelReturn {
  // 1. Gather External Dependencies (Centralized)
  // Context에서 메타데이터 가져오기 (optional override 지원)
  const { pageId } = useCanvasMetadata(
    props.canvasMetadata
  );

  const edgeManagement = useCanvasEdgeManagement({
    pageId,
  });

  // 2. Bundle Dependencies into semantic objects
  const domainDeps: DomainDependencies = {
    updateEdgeLabel: edgeManagement.updateEdgeLabel,
  };

  // 3. UI State (Designer Area)
  const uiState = useEdgeLabelUI({
    label: props.label,
  });

  // 4. Business Logic (Engineer Area) - Dependency Injection
  const defaultBusiness = useEdgeLabelBusiness(domainDeps);
  const business = businessLogic ?? defaultBusiness;

  // 5. Combined Handlers
  const handleLabelClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!uiState.labelState.isEditing) {
        // Store original label when starting edit (server value)
        uiState.updateOriginalLabel(uiState.labelState.label);
        uiState.setDraftLabel(uiState.labelState.label);
        uiState.setIsEditing(true);
      }
    },
    [uiState]
  );

  const handleLabelBlur = useCallback(async () => {
    uiState.setIsEditing(false);

    // Compare with original label (server value)
    if (uiState.labelState.draftLabel !== uiState.labelState.originalLabel) {
      if (business) {
        // updateLabel performs optimistic update automatically
        // It immediately updates React Flow Store, then calls server
        // On failure, it automatically rolls back
        const success = await business.updateLabel(
          props.edgeId,
          uiState.labelState.draftLabel
        );

        // Only update original label reference if server save succeeded
        // (React Flow Store is already updated optimistically)
        if (success) {
          uiState.updateOriginalLabel(uiState.labelState.draftLabel);
        } else {
          // On failure, draftLabel should revert to originalLabel
          // This happens automatically via useEffect when React Flow Store rolls back
          uiState.setDraftLabel(uiState.labelState.originalLabel);
        }
      } else {
        // No business logic provided (e.g., in Storybook)
        // Just update the original label reference
        uiState.updateOriginalLabel(uiState.labelState.draftLabel);
      }
    }
  }, [uiState, business, props.edgeId]);

  const handleLabelChange = useCallback(
    (value: string) => {
      uiState.setDraftLabel(value);
    },
    [uiState]
  );

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        uiState.inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        // Escape: restore original value
        uiState.setDraftLabel(uiState.labelState.originalLabel);
        uiState.setIsEditing(false);
      }
    },
    [uiState]
  );

  return {
    labelState: uiState.labelState,
    setIsEditing: uiState.setIsEditing,
    setDraftLabel: uiState.setDraftLabel,
    inputRef: uiState.inputRef,
    handleLabelClick,
    handleLabelBlur,
    handleLabelChange,
    handleLabelKeyDown,
  };
}
