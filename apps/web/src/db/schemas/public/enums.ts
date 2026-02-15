/**
 * Public schema – shared and domain enums.
 */
import { pgEnum } from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('user_type', ['ADMIN', 'GENERAL']);
export const organizationTypeEnum = pgEnum('organization_type', [
  'personal',
  'education',
  'startup',
  'agency',
  'company',
  'n/a',
]);
export const memberRoleEnum = pgEnum('member_role', [
  'owner',
  'admin',
  'member',
]);
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'invitation',
  'workspace-invitation',
  'system',
  'announcement',
]);

// Canvas Management Domain Enums
export const canvasEdgeShapeEnum = pgEnum('canvas_edge_shape', [
  'default',
  'straight',
  'step',
  'smoothstep',
  'simplebezier',
]);

export const edgeMarkerEnum = pgEnum('edge_marker', [
  'none',
  'arrow',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open',
]);

export const alignmentTypeEnum = pgEnum('alignment_type', [
  'TOP',
  'BOTTOM',
  'LEFT',
  'RIGHT',
  'HORIZONTAL_CENTER',
  'VERTICAL_CENTER',
  'HORIZONTAL_DISTRIBUTE',
  'VERTICAL_DISTRIBUTE',
]);

// Canvas Management Domain Enums - Block View Mode
export const blockViewModeEnum = pgEnum('block_view_mode', [
  'note',
  'original',
  'card',
]);

// Block Management Domain Enums
export const blockTypeEnum = pgEnum('block_type', [
  'text', // 텍스트 블록
  'shape', // 도형 블록
  'image', // 이미지 블록
  'markdown', // 마크다운 블록
  'link', // 링크 블록
  'youtube', // 유튜브 블록
  'pdf', // PDF 문서 블록
  'audio', // 오디오 블록
  'video', // 비디오 블록
  'file', // 파일 블록
  'python', // 파이썬 코드 블록
  'page_mention', // 페이지 멘션 블록
  'latex', // 라텍스 블록
  'react_component', // 리액트 컴포넌트 블록
  'github_branch', // 깃헙 브랜치 블록
  'github_commit', // 깃헙 커밋 블록
  'github_pr', // 깃헙 PR 블록
  'react_preview', // 리액트 프리뷰 블록 (Sandbox)
  'vercel_deployment', // Vercel 배포 블록
  'group', // 그룹 블록 (Parent-Child 컨테이너)
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'text', // 텍스트 속성
  'url', // URL 속성
  'email', // 이메일 속성
  'phone', // 전화번호 속성
  'select', // 선택형 속성
  'multiselect', // 멀티선택형 속성
  'status', // 상태형 속성
  'datetime', // 날짜/날짜시간 속성 (시간 옵션 포함)
  'media', // 미디어 속성
  'profile', // 프로필 속성
]);

// Beta Management Enum
export const betaStatusEnum = pgEnum('beta_status', [
  'pending', // 신청서 작성 대기 또는 검토 중
  'approved', // 승인됨 (전체 기능 사용 가능)
]);

// Share Management Domain Enums
export const publishedPageStatusEnum = pgEnum('published_page_status', [
  'published', // 게시됨
  'unpublished', // 게시 취소됨
]);

// AI Management Domain Enums
export const eventTypeEnum = pgEnum('event_type', [
  'user_utterance', // 사용자 발화
  'ai_response', // AI 응답
  'tool_call', // 툴 호출
  'block', // 블럭 이벤트 (content/title 등)
  'block_mount', // 블럭 마운트 이벤트 (position, size, move, group)
  'edge', // 엣지 이벤트
  'component', // 컴포넌트 이벤트
  'instance', // 인스턴스 이벤트
  'property', // 속성 이벤트
  'property_value', // 속성값 이벤트
  'block_action', // 블럭 액션 이벤트
]);

export const eventActionEnum = pgEnum('event_action', [
  'created', // 생성
  'updated', // 수정
  'deleted', // 영구 삭제 (휴지통 완전 삭제 등)
  'soft_delete', // 소프트 삭제 (캔버스에서 제거, block_mount_soft_deleted)
  'duplicated', // 복제
  'set', // 설정 (속성값)
  'reset', // 리셋 (속성값)
]);
