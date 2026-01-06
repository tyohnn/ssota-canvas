/**
 * lib 폴더 Barrel Export
 *
 * ⚠️ 이 파일은 클라이언트/서버 모두에서 import 가능해야 합니다
 * 서버 전용 코드(Node.js APIs, database 등)는 직접 경로로 import하세요
 *
 * 권장 import 패턴:
 * - 공통 코드: import { ok, err } from '@/lib'
 * - 서버 전용: import { withSecureAction } from '@/lib/server-actions'
 * - 서버 전용: import { trackEvent } from '@/lib/analytics/mixpanel/server'
 */

// Result 패턴 (클라이언트/서버 공통)
export * from './server-actions/result';

// React 프로바이더 (클라이언트 전용)
export * from './providers';

// Mixpanel 클라이언트 (클라이언트 전용)
export { MixpanelProvider } from './analytics/mixpanel';

// 유틸리티 (공통)
export * from './utils';
