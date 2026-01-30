/**
 * Visual Summary Action Component
 * 
 * YouTube 블록에 Visual Summary 생성 액션을 추가하는 컴포넌트
 * Presentational Component (렌더링만 담당)
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import { Box } from '@/components/ui/box';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useVisualSummaryAction } from './core/use-visual-summary-action';
import { TemplateSelectorContent } from './components';

interface VisualSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function VisualSummaryAction({
  blockId,
  blockData,
}: VisualSummaryActionProps) {

  // 메인 훅 사용 (모든 로직 포함)
  const {
    // UI 상태
    isPopoverOpen,
    selectedTemplateId,
    setIsPopoverOpen,

    // 비즈니스 데이터
    videoSummary,
    isSummaryLoading,
    handleTemplateSelect,

    // UI 계산
    getIcon,

    // 추가 값
    templates,
    readonly,
  } = useVisualSummaryAction({ blockId, blockData });

  // 요약이 없는 상태인지 확인 (로딩 중이 아니고 요약도 없는 경우)
  const noSummaryAvailable = !isSummaryLoading && !videoSummary?.summary;

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(open) => {
        // 템플릿 선택 후에는 popover 닫기 (진행 상태는 우측 상단 패널에 표시)
        setIsPopoverOpen(open);
      }}
      modal={false}
    >
      <PopoverTrigger asChild disabled={readonly}>
        <Box>
          <ToolbarIconButton
            icon={getIcon()}
            tooltip={noSummaryAvailable ? "Extract summary first" : "Generate Visual Summary"}
            aria-label="Generate Visual Summary"
            disabled={readonly}
          />
        </Box>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[300px] p-2"
      >
        <AnimatePresence mode="wait">
          {/* 요약 로딩 중 */}
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
            /* 요약 없음 - 안내 메시지 */
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
            /* 템플릿 선택만 표시 (진행 상태는 우측 상단 패널에 표시) */
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
                    // 템플릿 선택 후 popover 닫기
                    setIsPopoverOpen(false);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

