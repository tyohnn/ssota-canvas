'use client';

import React, { useState, useRef } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Button } from '@workspace/ui/components/ui/button';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';
import { Node } from '@xyflow/react';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export function FileProperty({
  data,
  field,
  node,
}: {
  data: FileItem[];
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = data || [];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);

    const newFiles: FileItem[] = uploadedFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const updatedFiles = [...files, ...newFiles];
    updateField(node, field.path, updatedFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    updateField(node, field.path, updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full h-auto min-h-[32px] px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 text-muted-foreground transition-[color,box-shadow] select-none cursor-pointer ${
            isOpen
              ? 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border border-ring ring-ring/50 ring-[3px]'
              : ''
          }`}
        >
          <div className="flex flex-wrap gap-1 items-center w-full">
            {files.length > 0 ? (
              files.map(file => (
                <Badge
                  key={file.id}
                  variant="secondary"
                  className="text-xs px-2 py-1 h-5"
                >
                  {file.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Click to edit</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border border-border" align="start">
        <div className="p-4">
          {files.length > 0 && (
            <ScrollArea className="max-h-60 mb-3">
              <div className="space-y-2">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="relative">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border border-border"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Files
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
