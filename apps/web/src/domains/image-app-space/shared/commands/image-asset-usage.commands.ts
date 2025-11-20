/**
 * Image Asset Usage Commands
 *
 * Process Model: Scenario 4 - 이미지를 블록에 적용
 */

/**
 * 이미지 사용 기록 Command
 */
export interface RecordImageUsageCommand {
  imageAssetId: string;
  blockId: string;
  pageId: string;
}
