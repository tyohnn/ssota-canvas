'use client';

import React from 'react';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';

export function TableView({ view }: { view: ViewDefinition }) {
  return <div>TableView</div>;
}
