/**
 * Pure util: format context content (note_content, summary, source_content, etc.) with line numbers.
 * Lines added one by one until char limit (never cut mid-line).
 * Caller passes maxLines and maxChars.
 */

export interface FormatLinesResult {
  formatted: string;
  totalLines: number;
  actualStart: number;
  actualEnd: number;
}

export interface FormatContextContentOptions {
  maxLines: number;
  maxChars: number;
}

/**
 * Format content with line numbers (e.g. "   1| line1\n   2| line2").
 * Add lines one by one; stop when we would exceed maxChars (never cut a line). Respects maxLines.
 */
export function formatContextContentWithLineNumbers(
  text: string,
  startLine: number,
  endLine: number | undefined,
  options: FormatContextContentOptions
): FormatLinesResult {
  const { maxLines, maxChars } = options;

  const lines = text.split('\n');
  const totalLines = lines.length;
  const actualStart = Math.max(1, Math.min(startLine, totalLines));
  const maxEndFromStart = actualStart + maxLines - 1;
  const requestedEnd = endLine ? Math.min(endLine, totalLines) : totalLines;
  const cappedEnd = Math.min(requestedEnd, maxEndFromStart, totalLines);

  const result: string[] = [];
  let totalChars = 0;
  for (let i = actualStart - 1; i < cappedEnd; i++) {
    const line = lines[i] ?? '';
    const formattedLine = `${String(i + 1).padStart(4)}| ${line}`;
    const lineLen = formattedLine.length + (result.length > 0 ? 1 : 0);
    if (totalChars + lineLen > maxChars) break;
    result.push(formattedLine);
    totalChars += lineLen;
  }

  const actualEnd = actualStart - 1 + result.length;
  const formatted = result.join('\n');
  return { formatted, totalLines, actualStart, actualEnd };
}
