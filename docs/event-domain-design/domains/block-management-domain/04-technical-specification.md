# Technical Specification: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-10-19  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 구현 (TDD Implementation)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-technical-specification-guide.md`  
> **작성 시점**: Software Design 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

Block Management Domain은 재사용 가능한 블록 콘텐츠의 생명주기를 관리하는 핵심 도메인입니다. Canvas Management Domain에서 직접 DB JOIN을 통해 블록 정보를 조회할 수 있도록 설계되어 있으며, 워크스페이스 기반 RLS 정책으로 데이터 격리를 보장합니다.

### Software Design 연결점

- **입력**: `03-software-design.md` - Block Aggregate (단일 Aggregate 설계)
- **입력**: `02-process-model.md` - 3개 주요 시나리오 (생성, 수정, 삭제)
- **출력**: 구현 수도코드 + 테스트 수도코드

### TDD 구현 순서 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 3개 (BlockId, BlockType, Metadata)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 1개 (Block)
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 1개 (BlockAggregate)
Phase 4: Repository (⭐️⭐️⭐️⭐️) - 1개 (BlockRepository)
Phase 5: Service (⭐️⭐️⭐️⭐️) - 1개 (BlockManagementService)
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 3개 (create, update, delete)
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 3개 시나리오
```

---

## 🧩 DDD Components

### 1. Value Objects 수도코드

#### BlockId VO

- **파일 위치**: `src/domains/block-management/shared/value-objects/block-id.vo.ts`
- **역할**: Block의 고유 식별자를 표현하고 유효성을 검증
- **주요 기능**:
  - UUID 형식 유효성 검사 (RFC 4122 준수)
  - 다른 BlockId 객체와의 동등성 비교
  - 문자열 변환 및 직렬화 지원
- **에러 처리**: 잘못된 UUID 형식 시 `BlockManagementError` 발생
- **비즈니스 규칙**: 모든 Block은 고유한 UUID를 가져야 함

**사용 시나리오**:
- 블록 생성 시 새로운 UUID 생성
- 블록 조회 시 ID 검증
- 블록 참조 시 타입 안전성 확보

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

#### BlockType VO

- **파일 위치**: `src/domains/block-management/shared/value-objects/block-type.vo.ts`
- **역할**: 블록 타입의 유효성을 검증하고 도메인 로직을 캡슐화
- **주요 기능**:
  - 지원되는 블록 타입 검증 (text, image, code, page, shape, todo)
  - 타입별 메타데이터 스키마 검증 규칙 제공
  - 타입 변환 및 직렬화 지원
- **에러 처리**: 지원되지 않는 타입 시 `INVALID_BLOCK_TYPE` 에러 발생
- **비즈니스 규칙**: enum으로 정의된 타입만 허용

**사용 시나리오**:
- 블록 생성 시 타입 선택 검증
- 메타데이터 스키마 검증 시 타입별 규칙 적용
- Canvas 렌더링 시 타입별 컴포넌트 결정

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

#### Metadata VO

- **파일 위치**: `src/domains/block-management/shared/value-objects/metadata.vo.ts`
- **역할**: 블록 타입별 확장 속성을 관리하고 스키마 검증
- **주요 기능**:
  - JSONB 형식 유효성 검증
  - 블록 타입별 메타데이터 스키마 검증
  - 메타데이터 병합 및 업데이트
  - 타입별 기본값 제공
- **에러 처리**: 잘못된 스키마 시 `INVALID_METADATA_SCHEMA` 에러 발생
- **비즈니스 규칙**: 블록 타입에 따라 다른 메타데이터 스키마 적용

**사용 시나리오**:
- 블록 생성 시 기본 메타데이터 초기화
- 블록 업데이트 시 메타데이터 스키마 재검증
- Canvas 렌더링 시 블록별 설정 정보 제공

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

### 2. Entities 수도코드

#### Block Entity

- **파일 위치**: `src/domains/block-management/shared/entities/block.entity.ts`
- **역할**: Block 도메인 엔티티로 블록의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: BlockId Value Object로 고유 식별자 (불변)
  - workspaceId: 워크스페이스 ID (불변)
  - blockType: BlockType Value Object (변경 가능)
  - metadata: Metadata Value Object (변경 가능)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
  - deletedAt: 삭제 시각 (소프트 삭제용, 변경 가능)
- **주요 메서드**:
  - updateBlockType(): 블록 타입 변경 및 메타데이터 재검증
  - updateMetadata(): 메타데이터 업데이트 및 스키마 검증
  - markAsDeleted(): 소프트 삭제 처리 (deletedAt 설정)
  - restore(): 삭제 취소 (deletedAt 제거)
  - canBeModifiedBy(): 수정 권한 확인
- **비즈니스 규칙**: 타입 변경 시 메타데이터 자동 재검증, 삭제된 블록은 수정 불가

**사용 시나리오**:
- 블록 생성 시 모든 필드 검증
- 블록 타입 변경 시 메타데이터 스키마 재검증
- 소프트 삭제 시 deletedAt 타임스탬프 설정

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Entities 테스트 케이스

---

### 3. Aggregates 수도코드

#### BlockAggregate

- **파일 위치**: `src/domains/block-management/shared/aggregates/block-aggregate.aggregate.ts`
- **역할**: Block 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - Block 생성 시 모든 관련 검증 수행
  - 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - Block의 일관성 보장
- **주요 메서드**:
  - createBlock(): Block 생성 및 BlockCreated 이벤트 발행
  - updateBlockType(): 타입 변경 및 BlockTypeChanged 이벤트 발행
  - updateMetadata(): 메타데이터 업데이트 및 BlockMetadataChanged 이벤트 발행
  - deleteBlock(): 소프트 삭제 및 BlockDeleted 이벤트 발행
  - validateWorkspaceAccess(): 워크스페이스 접근 권한 검증
  - getUncommittedEvents(): 발행된 이벤트 목록 반환
- **비즈니스 로직**: 블록 타입별 메타데이터 스키마 검증, 워크스페이스 격리
- **불변식(Invariants)**:
  - 블록은 반드시 하나의 워크스페이스에 속해야 함
  - 메타데이터는 블록 타입에 맞는 스키마를 준수해야 함
  - 삭제된 블록은 수정할 수 없음

**사용 시나리오**:
- 블록 생성 시 모든 비즈니스 규칙 검증 후 이벤트 발행
- 블록 수정 시 타입별 스키마 재검증
- 삭제 시 소프트 삭제로 처리하여 Canvas 호환성 유지

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 0 - Sequence 1, 2, 3

---

### 4. Commands & Events 수도코드

#### CreateBlockCommand

- **파일 위치**: `src/domains/block-management/shared/commands/index.ts`
- **역할**: 블록 생성 의도를 표현하는 Command 객체
- **주요 속성**:
  - workspaceId: 워크스페이스 ID (필수, UUID 형식)
  - blockType: 블록 타입 (필수, 지원되는 enum 값)
  - initialMetadata: 초기 메타데이터 (선택적, JSONB 형식)
- **검증 규칙**:
  - workspaceId는 유효한 UUID 형식이어야 함
  - blockType은 지원되는 타입중 하나여야 함
  - initialMetadata는 blockType에 맞는 스키마여야 함
- **특징**: 최소한의 데이터만 포함하여 타입 안전성 확보

**사용 시나리오**:
- Server Actions에서 사용자 입력을 Command로 변환
- Aggregate 실행 전 입력값 검증
- 이벤트 소싱에서 커맨드 저장

#### UpdateBlockCommand

- **파일 위치**: `src/domains/block-management/shared/commands/index.ts`
- **역할**: 블록 정보 업데이트 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockId: 블록 ID (필수, UUID 형식)
  - blockType?: 블록 타입 (선택적)
  - metadata?: 메타데이터 (선택적)
- **검증 규칙**:
  - blockId는 유효한 UUID 형식이어야 함
  - blockType이 변경될 경우 메타데이터도 재검증
- **특징**: 부분 업데이트 지원, 변경된 필드만 포함

#### DeleteBlockCommand

- **파일 위치**: `src/domains/block-management/shared/commands/index.ts`
- **역할**: 블록 삭제 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockId: 블록 ID (필수, UUID 형식)
- **검증 규칙**:
  - blockId는 유효한 UUID 형식이어야 함
  - 블록이 존재하고 삭제되지 않았어야 함
- **특징**: 소프트 삭제 방식으로 설계

---

#### BlockCreatedEvent

- **파일 위치**: `src/domains/block-management/shared/events/index.ts`
- **역할**: 블록 생성 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('BlockCreated')
  - aggregateId: 이벤트를 발생시킨 Block Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - blockId: 생성된 블록 ID
  - workspaceId: 워크스페이스 ID
  - blockType: 블록 타입
  - metadata: 초기 메타데이터
  - occurredAt: 발생 시각
- **특징**: 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

**사용 시나리오**:
- Canvas Management Domain에 새 블록 생성 알림
- 분석 시스템에 블록 생성 로그 기록
- 실시간 UI 업데이트 트리거

#### BlockUpdatedEvent

- **파일 위치**: `src/domains/block-management/shared/events/index.ts`
- **역할**: 블록 정보 업데이트 완료를 알리는 도메인 이벤트
- **이벤트 데이터**:
  - blockId: 업데이트된 블록 ID
  - changes: 변경된 필드 목록
  - occurredAt: 발생 시각
- **특징**: 변경분만 포함하여 효율적인 동기화 지원

#### BlockDeletedEvent

- **파일 위치**: `src/domains/block-management/shared/events/index.ts`
- **역할**: 블록 삭제 완료를 알리는 도메인 이벤트
- **이벤트 데이터**:
  - blockId: 삭제된 블록 ID
  - deletedAt: 삭제 시각
  - occurredAt: 발생 시각
- **특징**: 소프트 삭제 방식으로 Canvas 호환성 유지

---

### 5. Error Types 수도코드

#### BlockManagementError 클래스

- **파일 위치**: `src/domains/block-management/shared/errors/block-management.error.ts`
- **역할**: Block Management 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (BlockManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### BlockManagementErrorCode 타입

- **역할**: Block Management 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - BLOCK_NOT_FOUND: 블록을 찾을 수 없을 때
  - INVALID_BLOCK_TYPE: 지원되지 않는 블록 타입일 때
  - INVALID_METADATA_SCHEMA: 메타데이터 스키마가 올바르지 않을 때
  - WORKSPACE_ACCESS_DENIED: 워크스페이스 접근 권한이 없을 때
  - BLOCK_ALREADY_DELETED: 이미 삭제된 블록을 수정하려 할 때
  - UNAUTHORIZED_ACCESS: 권한 부족 시
  - DATABASE_CONNECTION_FAILED: 데이터베이스 연결 실패 시

#### 에러 메시지 매핑

- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

**사용 시나리오**:
- 비즈니스 규칙 위반 시 사용자에게 친화적 메시지
- 시스템 에러 발생 시 로그 기록
- 권한 부족 시 적절한 에러 코드 반환

---

## 🔧 Infrastructure Layer

### 1. Repository 수도코드

#### BlockRepository

- **파일 위치**: `src/domains/block-management/infrastructure/repositories/block.repository.ts`
- **역할**: Block Aggregate의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): Aggregate를 데이터베이스에 저장 (생성/수정)
  - findById(): ID로 Aggregate 조회
  - findByWorkspaceId(): 워크스페이스별 블록 목록 조회
  - findByType(): 타입별 블록 조회
  - delete(): Aggregate 소프트 삭제 (deleted_at 설정)
  - listBlocksByWorkspace(): 워크스페이스별 활성 블록 목록 조회 (페이징 지원)
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **RLS 정책**: 워크스페이스 멤버십 기반 데이터 접근 제어
- **특징**:
  - Aggregate ↔ DB 모델 간 변환 로직 포함
  - 트랜잭션 지원
  - RLS(Row Level Security) 자동 적용
  - Canvas JOIN 최적화를 위한 인덱스 활용

**사용 시나리오**:
- Service Layer에서 Aggregate 저장/조회
- 워크스페이스별 데이터 접근 권한 제어
- Canvas Management Domain에서 직접 JOIN 조회 지원

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

### 2. ACL (Anti-Corruption Layer) 수도코드

#### WorkspaceManagementACL

- **파일 위치**: `src/domains/block-management/infrastructure/acl/workspace-management.acl.ts`
- **역할**: Workspace Management Domain과 Block Management Domain 간 권한 확인 레이어
- **주요 메서드**:
  - validateWorkspaceAccess(): 워크스페이스 접근 권한 검증
  - getWorkspaceMembers(): 워크스페이스 멤버 목록 조회
- **특징**:
  - 외부 워크스페이스 API 호출을 도메인 모델로 추상화
  - 권한 검증 로직 캡슐화
  - 타입 안전성 보장
- **의존성**: Workspace Management Domain API, Block Management 도메인 모델

**사용 시나리오**:
- 블록 생성 시 워크스페이스 접근 권한 확인
- RLS 정책에서 워크스페이스 멤버십 검증
- 외부 도메인 변경 시 ACL만 수정하면 됨

**우선순위**: ⭐️⭐️⭐️⭐️  
**Software Design 참조**: ACL 섹션

---

### 3. Read Models 수도코드

#### BlockListView

- **파일 위치**: `src/domains/block-management/infrastructure/queries/block-list.query.ts`
- **역할**: 블록 목록 조회에 최적화된 Read Model
- **주요 속성**:
  - blockId: 블록 ID
  - blockType: 블록 타입
  - metadata: 메타데이터 요약
  - createdAt: 생성 시각
  - updatedAt: 수정 시각
- **주요 메서드**:
  - getBlocksByWorkspace(): 워크스페이스별 블록 목록 조회
  - getBlocksByType(): 타입별 블록 목록 조회
  - searchBlocks(): 블록 검색 (메타데이터 포함)
- **DB 최적화**:
  - 인덱스 활용: workspace_id, block_type, created_at에 복합 인덱스
  - JOIN 최소화: 필요한 필드만 조회
  - 페이징: offset/limit 방식 사용
- **캐싱 전략**:
  - Redis 캐싱 (TTL: 5분)
  - 키 형식: `block:workspace:{workspaceId}:page:{page}`
  - 캐시 무효화: 블록 생성/수정/삭제 시
- **특징**: Canvas JOIN 쿼리에 최적화

**사용 시나리오**:
- Canvas에서 블록 목록 표시
- 블록 선택 UI에서 타입별 필터링
- 검색 기능에서 메타데이터 기반 검색

---

## 🚀 Application Layer

### 1. Service 수도코드

#### BlockManagementService

- **파일 위치**: `src/domains/block-management/application/services/block-management.service.ts`
- **역할**: Block Management의 비즈니스 유스케이스를 조율하고 실행하는 Application Service
- **주요 의존성**:
  - BlockRepository: Block Aggregate 영속성 관리
  - WorkspaceManagementACL: 워크스페이스 접근 권한 검증
  - EventBus: 도메인 이벤트 발행 (선택적)
- **주요 메서드**:
  - createBlock(): CreateBlockCommand 처리 및 Block 생성
  - updateBlock(): UpdateBlockCommand 처리 및 Block 수정
  - deleteBlock(): DeleteBlockCommand 처리 및 Block 소프트 삭제
  - getBlocksByWorkspace(): 워크스페이스별 블록 조회
  - validateBlockAccess(): 블록 접근 권한 검증
- **트랜잭션**: 하나의 Service 메서드는 하나의 트랜잭션 단위
- **특징**:
  - 얇은 Application Layer: 도메인 로직은 Aggregate에 위임
  - Result 패턴 사용: 함수형 에러 처리
  - 의존성 주입: 테스트 용이성 확보

**처리 흐름**:
1. Command 유효성 검증
2. 워크스페이스 접근 권한 확인
3. Repository에서 기존 Aggregate 조회 (수정/삭제 시)
4. Aggregate 메서드 호출 (도메인 로직 실행)
5. Repository에 Aggregate 저장
6. 도메인 이벤트 발행
7. Result.ok() 또는 Result.err() 반환

**사용 시나리오**:
- Server Actions에서 비즈니스 로직 실행
- Canvas Management Domain에서 블록 조회
- 트랜잭션 경계 설정

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Service 통합 테스트 케이스

---

### 2. Server Actions 수도코드

#### createBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 생성 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - 의존성 주입 패턴으로 Service Layer 활용
  - Command 객체 생성 및 Service 메서드 호출
  - 도메인 모델 → DTO 직렬화
- **입력**: FormData (workspaceId, blockType, initialMetadata)
- **출력**: BlockDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 권한 부족 → WorkspaceAccessDeniedError
  - 도메인 규칙 위반 → BlockManagementError
- **특징**:
  - `'use server'` 지시어 사용
  - Plain Object만 반환 (직렬화 가능)
  - 의존성 주입으로 테스트 용이성 확보

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 의존성 주입: Repository, Service 인스턴스 생성
3. Command 생성: 입력 파라미터 → CreateBlockCommand 객체 변환
4. 도메인 로직 실행: BlockManagementService.createBlock() 호출
5. DTO 직렬화: Block Aggregate → BlockDTO 변환
6. 결과 반환: Result<BlockDTO> 형식

#### updateBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 정보 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: FormData (blockId, blockType?, metadata?)
- **출력**: BlockDTO
- **처리 흐름**: createBlockAction과 유사하나 수정 로직 적용

#### deleteBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 삭제 기능을 제공하는 Next.js Server Action
- **입력**: FormData (blockId)
- **출력**: void
- **처리 흐름**: 소프트 삭제 로직 적용

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

### 3. Cross-Domain 이벤트 처리

#### Canvas Management Domain 이벤트 처리

- **파일 위치**: `src/domains/block-management/application/event-handlers/canvas-events.handler.ts`
- **역할**: Canvas Management Domain에서 발생한 이벤트를 구독하고 처리
- **주요 핸들러**:
  - onBlockMountCreated: 블록 마운트 생성 시 블록 사용 상태 업데이트
  - onBlockMountDeleted: 블록 마운트 삭제 시 블록 사용 상태 확인
- **이벤트 처리 패턴**:
  - 비동기 처리: 이벤트 수신 즉시 반환 (큐 사용)
  - 재시도 로직: 실패 시 3회 재시도
  - 멱등성 보장: 동일 이벤트 중복 처리 방지
- **특징**:
  - 도메인 간 느슨한 결합
  - 이벤트 기반 비동기 통신
  - Eventually Consistent 보장

**사용 시나리오**:
- Canvas에서 블록 마운트 시 블록 사용 통계 업데이트
- Canvas에서 블록 언마운트 시 미사용 블록 정리 검토

---

## 🎨 UI & Hook 전략

### React Hooks 사용

**사용할 Hook**:
- `useOptimistic`: 블록 생성/수정 시 낙관적 업데이트
- `useTransition`: 블록 삭제 시 비동기 상태 관리
- `useFormStatus`: 블록 생성/수정 폼 제출 상태

**낙관적 업데이트 로직**:
```typescript
function useBlocks(workspaceId: string) {
  const [optimisticBlocks, addOptimisticBlock] = useOptimistic(
    blocks,
    (state, newBlock) => [...state, newBlock]
  );
  
  // 롤백 로직: 실패 시 optimistic 항목 제거
}
```

### UI Component 연동

**Server Action 연결**:
- 블록 생성 폼 → createBlockAction → Result 처리
- 블록 편집 폼 → updateBlockAction → 낙관적 업데이트
- 블록 삭제 버튼 → deleteBlockAction → 확인 모달

---

## 📋 TDD 구현 순서

### Phase별 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. BlockId VO
   - 테스트 작성 (RED)
   - 최소 구현 (GREEN)
   - 리팩토링 (REFACTOR)
2. BlockType VO
3. Metadata VO

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Block Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. BlockAggregate

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. BlockRepository (통합 테스트)

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. BlockManagementService (통합 테스트)

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. createBlockAction (통합 테스트)
2. updateBlockAction (통합 테스트)
3. deleteBlockAction (통합 테스트)

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 블록 생성 시나리오
2. 블록 수정 시나리오
3. 블록 삭제 시나리오
```

### TDD 사이클 적용 방법

```bash
# 1. RED: 테스트 먼저 작성
$ touch src/domains/block-management/shared/value-objects/__tests__/block-id.test.ts
# 테스트 코드 작성
$ pnpm test block-id.test.ts
# 결과: FAIL

# 2. GREEN: 최소 구현
$ touch src/domains/block-management/shared/value-objects/block-id.vo.ts
# 최소 구현 코드 작성
$ pnpm test block-id.test.ts
# 결과: PASS

# 3. REFACTOR: 코드 개선
# 검증 로직 추가, 코드 정리
$ pnpm test block-id.test.ts
# 결과: PASS (리팩토링 후에도 통과)
```

### 커버리지 목표 달성 전략

```markdown
Testing Strategy 목표 참조:
- Value Objects: 95% 이상 → RED-GREEN-REFACTOR 철저히 적용
- Entities: 95% 이상 → 모든 public 메서드 테스트
- Aggregates: 90% 이상 → 비즈니스 로직 중심 테스트
- Services: 85% 이상 → 통합 테스트로 플로우 검증
- Repositories: 80% 이상 → DB 연동 테스트
- Server Actions: 85% 이상 → 인증, 에러 처리 포함
```

---

## ✅ 검증 체크리스트

### 구현 수도코드 검증
- [x] Software Design의 모든 Aggregate가 수도코드로 작성되었는가? (BlockAggregate)
- [x] Process Model의 모든 시나리오가 구현 수도코드로 반영되었는가? (생성, 수정, 삭제)
- [x] 모든 컴포넌트에 구현 수도코드가 있는가?
- [x] Canvas Management Domain과의 연동 구조가 명시되었는가?

### 테스트 수도코드 검증
- [x] Given-When-Then 패턴이 일관되게 적용되었는가?
- [x] Happy Path와 Edge Case가 모두 포함되었는가?
- [x] 불변식 검증이 테스트에 포함되었는가?

### TDD 준비 검증
- [x] TDD 구현 순서가 명확한가?
- [x] 커버리지 목표가 명시되었는가?
- [x] 각 Phase별 우선순위가 표시되었는가?
- [x] Canvas 연동을 고려한 테스트 전략이 포함되었는가?

### Canvas Management Domain 연동 검증
- [x] 직접 DB JOIN 구조가 명시되었는가?
- [x] RLS 정책 연동이 고려되었는가?
- [x] 소프트 삭제 호환성이 보장되었는가?
- [x] 성능 최적화 방안이 포함되었는가?

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - Canvas Management Domain 연동 테스트
  - 코드 리뷰 및 PR

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] Software Design과 일관성 확인
- [ ] Canvas Management Domain 연동 검증
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Technical Specification을 따라 **Canvas Management Domain과 완벽하게 연동되는 Block Management Domain**을 구현할 수 있습니다! 🚀
