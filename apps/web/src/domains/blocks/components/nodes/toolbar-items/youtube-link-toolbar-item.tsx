"use client";

import { useCallback, useState } from 'react';
import { Node } from '@xyflow/react';
import { Link, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface YouTubeLinkToolbarItemProps {
  node: Node;
  currentUrl: string;
  disabled?: boolean;
}

export function YouTubeLinkToolbarItem({ 
  node,
  currentUrl, 
  disabled = false 
}: YouTubeLinkToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [isOpen, setIsOpen] = useState(false);

  const handleUrlSubmit = useCallback(async () => {
    if (!inputUrl.trim()) return;

    const result = await styleCommands.updateFormData(node, {
      url: inputUrl.trim(),
    });

    if (result.ok) {
      setIsOpen(false);
    } else {
      console.error("YouTube URL 업데이트 실패:", result.error);
    }
  }, [inputUrl, node, styleCommands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
    }
  }, [handleUrlSubmit]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setInputUrl(currentUrl);
    }
  }, [currentUrl]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={(e) => e.stopPropagation()}
          title="YouTube Link"
          disabled={disabled}
        >
          <Link className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-3 w-80"
        side="top"
        align="center"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="youtube-url" className="text-sm font-medium">
              YouTube URL
            </label>
            <Input
              id="youtube-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleUrlSubmit}
              disabled={!inputUrl.trim()}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}







