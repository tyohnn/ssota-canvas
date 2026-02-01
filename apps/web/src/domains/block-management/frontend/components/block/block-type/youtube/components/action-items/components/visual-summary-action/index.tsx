/**
 * Visual Summary Action Component
 *
 * Container Component: Hook → Props 변환
 * YouTube 블록에 Visual Summary 생성 액션을 추가하는 컴포넌트
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { TemplateSelectorContent } from './components';
import { useVisualSummaryAction } from './core/use-visual-summary-action';
import { VisualSummaryActionView } from './visual-summary-action.view';

interface VisualSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function VisualSummaryAction({
  blockId,
  blockData,
}: VisualSummaryActionProps) {
  const {
    isPopoverOpen,
    selectedTemplateId,
    setIsPopoverOpen,
    videoSummary,
    isSummaryLoading,
    handleTemplateSelect,
    getIcon,
    templates,
    readonly,
  } = useVisualSummaryAction({ blockId, blockData });

  const noSummaryAvailable = !isSummaryLoading && !videoSummary?.summary;

  const popoverContent = (
    <AnimatePresence mode="wait">
      {isSummaryLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Box className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading summary...</span>
          </Box>
        </motion.div>
      ) : noSummaryAvailable ? (
        <motion.div
          key="no-summary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Box className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Please extract summary first to generate visual summary.</span>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          key="template"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <TemplateSelectorContent
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={(template) => {
              const started = handleTemplateSelect(template);
              if (started) {
                setIsPopoverOpen(false);
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <VisualSummaryActionView
      icon={getIcon()}
      tooltip={noSummaryAvailable ? 'Extract summary first' : 'Generate Visual Summary'}
      disabled={readonly}
      isPopoverOpen={isPopoverOpen}
      onPopoverOpenChange={setIsPopoverOpen}
      popoverContent={popoverContent}
    />
  );
}

