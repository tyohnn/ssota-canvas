/**
 * read tool part types and helpers.
 *
 * Data flow: readBlockLines service yields ReadBlockLinesFinal.
 * part.output receives that payload; shape matches ReadToolOutput.
 */

/** Output from read (readBlockLines) tool. */
export interface ReadToolOutput {
  blockMountId: string;
  blockType: string;
  title: string;
  content: string;
  totalLines: number;
  requestedRange: { start: number; end: number };
  actualRange: { start: number; end: number };
  source?: 'content_raw' | 'source_content' | 'source_summary';
  summaryLanguage?: string;
}

interface PartWithToolIdentity {
  type?: string;
  toolName?: string;
}

export function isReadToolPart(part: PartWithToolIdentity): boolean {
  return part.toolName === 'read' || part.type === 'tool-read';
}
