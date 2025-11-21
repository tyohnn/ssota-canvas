'use client';

import { useEffect, useState } from 'react';

/**
 * Indicates whether the component is running on the client.
 *
 * On the server this hook always returns false. Once the component
 * hydrates on the client it flips to true. Useful when we need to
 * defer rendering of a subtree until after hydration (e.g. components
 * relying on browser-only APIs or generating non-deterministic IDs).
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
