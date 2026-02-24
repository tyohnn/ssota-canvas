'use client';

import { useState } from 'react';

export function useTableOfContentsUI() {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    setIsHovered,
  };
}
