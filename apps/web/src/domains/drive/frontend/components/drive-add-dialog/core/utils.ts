/**
 * createDriveBlock 반환 blockId(UUID) → ensureSourceAndJob 등에서 사용할 slug
 */
export function slugFromUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}
