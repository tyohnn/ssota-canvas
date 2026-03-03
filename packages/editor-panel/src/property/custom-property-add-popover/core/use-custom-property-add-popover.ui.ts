import { useCallback, useRef, useState } from 'react';

export interface UseCustomPropertyAddPopoverUIResult {
  open: boolean;
  propertyName: string;
  icon: string | null;
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
  handleOpenChange: (open: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Local UI state: open, propertyName, icon, inputRef.
 */
export function useCustomPropertyAddPopoverUI(): UseCustomPropertyAddPopoverUIResult {
  const [open, setOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPropertyName('');
      setIcon(null);
    }
  }, []);

  return {
    open,
    propertyName,
    icon,
    setOpen,
    setPropertyName,
    setIcon,
    handleOpenChange,
    inputRef,
  };
}
