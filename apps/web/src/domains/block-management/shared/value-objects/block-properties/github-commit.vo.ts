/**
 * GitHub Commit Block Properties
 *
 * 사용자가 직접 설정/입력하는 속성만 포함
 */

export interface GithubCommitBlockProperties {
  repository: string; // 리포지토리 (예: 'owner/repo')
  commitHash: string; // 커밋 해시 (예: 'a3f7c2d' 또는 전체 해시)
  // 자동 fetch 데이터는 컴포넌트 내부 state로 관리:
  // - commitMessage, author, timestamp, ciStatus, filesChanged 등
}
