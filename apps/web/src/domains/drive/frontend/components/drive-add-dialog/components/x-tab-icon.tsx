'use client';

import { XIcon } from '@workspace/ui/components/ssota-ui/x-icon';

/**
 * X (Twitter) logo icon for Drive Add Dialog tab.
 * Uses shared XIcon from ssota-ui (same as X block preview card).
 */
export function XTabIcon({ className }: { className?: string }) {
  return <XIcon className={className} />;
}
