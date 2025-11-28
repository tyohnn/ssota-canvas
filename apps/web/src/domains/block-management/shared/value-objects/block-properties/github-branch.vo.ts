/**
 * GitHub Branch Block Properties
 *
 * 사용자가 직접 설정/입력하는 속성만 포함
 */

export interface GithubBranchBlockProperties {
  repository: string; // 리포지토리 (예: 'owner/repo')
  branchName: string; // 브랜치 이름 (예: 'feature/canvas-demo')
  // 자동 fetch 데이터는 컴포넌트 내부 state로 관리:
  // - lastCommit, commitCount, status, updatedAt 등
}
