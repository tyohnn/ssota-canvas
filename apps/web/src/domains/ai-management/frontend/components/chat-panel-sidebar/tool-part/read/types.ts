/**
 * read tool part types and helpers.
 *
 * Data flow: readBlockLines service yields ReadBlockLinesFinal.
 * part.output receives that payload; shape matches ReadToolOutput.
 */

/** Source type for read tool display labels */
export type ReadToolSourceType = 'note_content' | 'source_content' | 'source_summary';

/** Output from read (readBlockLines) tool. */
export interface ReadToolOutput {
  blockMountId: string;
  status: 'done' | 'error';
  totalLines: number;
  chars: number;
  actualStart?: number;
  actualEnd?: number;
  /** Block title for display */
  title?: string;
  /** Source type: note_content→Note, source_summary→Summary, source_content→Raw Content */
  source?: ReadToolSourceType;
  /** Formatted content with line numbers (same format as context builder) */
  content?: string;
}

interface PartWithToolIdentity {
  type?: string;
  toolName?: string;
}

export function isReadToolPart(part: PartWithToolIdentity): boolean {
  return part.toolName === 'read' || part.type === 'tool-read';
}
