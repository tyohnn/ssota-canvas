import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { SummarizeLinkAction } from './components/summarize-link-action';

export function LinkActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <>
      <SummarizeLinkAction blockId={blockId} blockData={blockData} />
    </>
  );
}
