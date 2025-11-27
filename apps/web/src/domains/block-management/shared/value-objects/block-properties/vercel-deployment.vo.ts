/**
 * Vercel Deployment Block Properties
 *
 * 사용자가 직접 설정/입력하는 속성만 포함
 */

export interface VercelDeploymentBlockProperties {
  projectName: string; // Vercel 프로젝트 이름 (예: 'ssota-web')
  deploymentUrl: string; // 배포 URL (예: 'ssota-abc123.vercel.app')
  // 자동 fetch 데이터는 컴포넌트 내부 state로 관리:
  // - status, branch, commitMessage, deployedAt, buildTime 등
}
