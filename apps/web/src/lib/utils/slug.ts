/**
 * UUID를 8자 hex slug로 변환
 * - block_mounts.slug, edges.slug와 동일한 규칙 (page 내 유일 식별자)
 * - DB 충돌 시 10자 확장 가능하나, event log는 8자 derived로 통일
 */
export function uuidToSlug(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}
