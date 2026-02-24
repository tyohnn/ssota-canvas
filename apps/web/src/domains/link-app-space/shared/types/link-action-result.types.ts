/**
 * Link Block Action Result
 *
 * mode: 'replace' - 클라이언트가 properties를 기존 블록 properties에 병합
 */
export interface LinkActionPropertiesResult {
  mode: 'replace';
  properties: Record<string, unknown>;
}
