import { useState } from 'react';

export interface UseCustomPropertyItemUIResult {
  isPopoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
}

/**
 * Local popover open state.
 */
export function useCustomPropertyItemUI(): UseCustomPropertyItemUIResult {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  return { isPopoverOpen, setPopoverOpen };
}
