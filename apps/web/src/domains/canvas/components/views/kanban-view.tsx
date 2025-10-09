'use client';

import React from 'react';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';

export function KanbanView({ view }: { view: ViewDefinition }) {
  return <div>KanbanView</div>;
}
