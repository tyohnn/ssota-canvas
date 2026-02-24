declare module 'diff-match-patch' {
  export default class DiffMatchPatch {
    patch_make(text1: string, text2: string): unknown[];
    patch_toText(patches: unknown[]): string;
  }
}
