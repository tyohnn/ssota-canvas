/**
 * Extract adapter interface: URL + optional metadata → rawContent + optional structured payload
 */
export interface ExtractResult {
  rawContent: string;
  structuredPayload?: unknown;
  contentLanguage?: string | null;
}

export interface IExtractAdapter {
  extract(
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<ExtractResult>;
}
