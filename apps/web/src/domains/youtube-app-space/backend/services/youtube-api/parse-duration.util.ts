/**
 * ISO 8601 duration 문자열을 초 단위로 변환
 *
 * 예: "PT1H2M10S" -> 3730 (1시간 2분 10초)
 *
 * @param duration - ISO 8601 duration 문자열
 * @returns 초 단위 길이
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
