/**
 * LLM이 title/content 문자열에 넣은 줄바꿈을 실제 줄바꿈으로 통일합니다.
 * - 문자열 안에 "\\n" (백슬래시+n) 두 글자 → 실제 줄바꿈
 * - 줄 끝 "\\" + 줄바꿈 → 줄바꿈만 (잘못 쓴 줄 끝 백슬래시 제거)
 */
export function normalizeNewlinesInString(s: string): string {
  return s.replace(/\\\n/g, '\n').replace(/\\n/g, '\n');
}
