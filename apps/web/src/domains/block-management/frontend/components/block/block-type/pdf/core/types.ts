import type { PdfBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export type UpdateBlockTitleFn = (input: {
  nodeId: string;
  title: string;
  blockData: PdfBlockNodeData;
}) => Promise<boolean>;

export interface UsePdfBlockProps {
  nodeData: PdfBlockNodeData;
  selected: boolean;
  nodeId: string;
  updateBlockTitle?: UpdateBlockTitleFn;
}

export interface UsePdfBlockReturn {
  url: string;
  filename?: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isUploading: boolean;
  uploadErrors: string[];
  isDragging: boolean;

  // File upload
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: () => Record<string, unknown>;

  // PDF load callbacks
  onDocumentLoadSuccess: (params: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
}

export type PdfViewProps = UsePdfBlockReturn & {
  selected: boolean;
  width: number;
  height: number;
};
