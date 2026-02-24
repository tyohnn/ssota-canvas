import DiffMatchPatch from 'diff-match-patch';

/**
 * 두 문자열의 diff를 patch 형식으로 생성 (edge label, block title 감사 로그용)
 * DiffMatchPatch.patch_toText 형식 사용. 디코딩된 형태로 저장 (block content blur audit와 동일).
 */
export function createTextPatch(before: string, after: string): string {
  if (before === after) return '';
  const dmp = new DiffMatchPatch();
  const patches = dmp.patch_make(before, after);
  if (patches.length === 0) return '';
  let patchStr = dmp.patch_toText(patches);
  try {
    patchStr = decodeURIComponent(patchStr);
  } catch {
    // keep original if decode fails
  }
  return patchStr;
}
