/**
 * Output Count Select Component
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

/**
 * 출력 개수 옵션
 */
const OUTPUT_COUNT_OPTIONS = [1, 2, 3, 4];

/**
 * Output Count Select Component
 */
export function OutputCountSelect(): React.ReactElement {
  const { outputCount, setOutputCount, isGenerating } =
    useGenerateImageActionContext();

  return (
    <Select
      value={outputCount.toString()}
      onValueChange={val => setOutputCount(Number(val))}
      disabled={isGenerating}
    >
      <SelectTrigger className="h-8 w-[70px] text-xs">
        <SelectValue placeholder="개수" />
      </SelectTrigger>
      <SelectContent>
        {OUTPUT_COUNT_OPTIONS.map(count => (
          <SelectItem key={count} value={count.toString()}>
            <span className="text-xs">{count}개</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
