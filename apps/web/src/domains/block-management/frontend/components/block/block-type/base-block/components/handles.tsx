/**
 * Handles Component
 *
 * 상하좌우 연결점 (Connection Handles)
 */

'use client';

import { Handle, Position } from '@xyflow/react';
import { useBaseBlockContext } from '../core/context';

const handleClassName =
  'w-3! h-3! bg-background! border-2! border-gray-300! dark:border-gray-600! hover:border-blue-500! hover:scale-110! transition-all z-50!';

export function Handles() {
  const { isConnectable } = useBaseBlockContext();

  return (
    <>
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        id="left"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="right"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        id="top"
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="bottom"
        className={handleClassName}
      />
    </>
  );
}
