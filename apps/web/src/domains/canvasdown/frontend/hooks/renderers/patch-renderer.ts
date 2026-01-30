/**
 * Patch DSL 판별
 *
 * Patch DSL 여부만 판별합니다.
 * 실제 @update/@add/@delete/@connect/@disconnect 적용은
 * @ssota-labs/canvasdown-reactflow의 useCanvasdownPatch + applyPatch를 사용합니다.
 */

/**
 * Patch DSL인지 확인합니다.
 *
 * @param canvasdown - Canvasdown 코드
 * @returns Patch DSL 여부
 */
export function isPatchDSL(canvasdown: string): boolean {
  const trimmed = canvasdown.trim();
  return (
    trimmed.startsWith('@update') ||
    trimmed.startsWith('@add') ||
    trimmed.startsWith('@delete') ||
    trimmed.startsWith('@connect') ||
    trimmed.startsWith('@disconnect')
  );
}

/**
 * @update 패치에서 title/content가 더블쿼트로 감싸져 있는지 검사합니다.
 * 파서 에러(예: →/← 등으로 unexpected character)를 막기 위해 사용합니다.
 *
 * @param dsl - Patch DSL 문자열
 * @returns { ok: true } 또는 { ok: false, violations: string[] }
 */
export function checkPatchDslDoubleQuotes(dsl: string): {
  ok: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const re = /\b(title|content)\s*:\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dsl)) !== null) {
    const after = dsl.slice(m.index + m[0].length);
    if (!/^\s*"/.test(after)) {
      violations.push(
        `@update ${m[1]} must be double-quoted (e.g. ${m[1]}: \"...\").`
      );
    }
  }
  return { ok: violations.length === 0, violations };
}
