/**
 * Model Select Component
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { useGenerateImageActionContext } from '../../generate-image-action.context';
import { Box } from '@/components/ui/box';

/**
 * Model Select Component
 */
export function ModelSelect(): React.ReactElement {
  const { modelId, setModelId, availableModels, isGenerating } =
    useGenerateImageActionContext();

  return (
    <Select value={modelId} onValueChange={setModelId} disabled={isGenerating}>
      <SelectTrigger className="h-8 w-[180px] text-xs">
        <SelectValue placeholder="모델" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map(model => (
          <SelectItem key={model.id} value={model.id}>
            <Box className="flex items-center justify-between w-full">
              <span className="text-xs">{model.label}</span>
            </Box>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
