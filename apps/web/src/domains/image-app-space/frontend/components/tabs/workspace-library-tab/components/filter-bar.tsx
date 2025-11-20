/**
 * Workspace Library Filter Bar
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { useWorkspaceLibraryContext } from '../core/workspace-library.context';

/**
 * Filter Bar Component
 */
export function WorkspaceFilterBar() {
  const { filterType, setFilterType } = useWorkspaceLibraryContext();

  return (
    <div className="border-b p-4">
      <div className="flex gap-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('all')}
        >
          All
        </Button>
        <Button
          variant={filterType === 'ai-generated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('ai-generated')}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Generated
        </Button>
        <Button
          variant={filterType === 'unsplash' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('unsplash')}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Unsplash
        </Button>
        <Button
          variant={filterType === 'user-upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('user-upload')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Uploaded
        </Button>
      </div>
    </div>
  );
}

