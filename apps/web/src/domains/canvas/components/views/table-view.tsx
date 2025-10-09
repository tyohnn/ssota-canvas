'use client';

import React from 'react';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';

/**
 * Renders a table view placeholder for the provided view definition.
 *
 * @param view - The view configuration used to render the table
 * @returns A JSX element containing a table view placeholder
 */
export function TableView({ view }: { view: ViewDefinition }) {
  return <div>TableView</div>;
}