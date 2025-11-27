/**
 * React Preview Block Properties
 *
 * 사용자가 직접 설정/입력하는 속성만 포함
 */

export interface ReactPreviewBlockProperties {
  code: string; // React 컴포넌트 코드 (사용자가 작성)
  // 렌더링 옵션은 컴포넌트 내부에서 관리:
  // - template, autorun, autoReload 등
}
