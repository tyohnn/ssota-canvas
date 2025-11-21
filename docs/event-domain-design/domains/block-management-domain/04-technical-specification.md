# Technical Specification: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-10-22  
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

Block Management Domain은 재사용 가능한 블록 콘텐츠의 생명주기를 관리하는 핵심 도메인입니다. **유연한 속성 시스템**과 **블록 타입별 특화 기능(Tools)**을 제공하며, Canvas Management Domain에서 직접 DB JOIN을 통해 블록 정보를 조회할 수 있도록 설계되어 있습니다.

### Software Design 연결점

- **입력**: `03-software-design.md` - Block Aggregate (실제 구현: 5개 Commands, 5개 Events)
- **입력**: `02-process-model.md` - 5개 주요 시나리오 (Canvas 연동, Custom Properties, Property Values, Media Upload, Block Tools)
- **출력**: 구현 수도코드 + 테스트 수도코드
- **참고**: 설계 문서의 일부 기능(Custom Property Commands, Media Commands, Tool Commands)은 Aggregate 레벨이 아닌 Entity나 Service 레벨에서 처리됨

### TDD 구현 순서 요약 (실제 구현 기준)

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 완료
  - BlockId, BlockType, PropertyType, MediaURL ✅
  - PropertyOption, PropertyValidation, CustomPropertyDefinitionVO ✅
  - BlockPropertiesVO (타입별 Value Objects) ✅

Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 완료
  - Block Entity ✅

Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 완료
  - BlockAggregate ✅

Phase 4: Repository (⭐️⭐️⭐️⭐️) - 완료
  - DrizzleBlockRepository ✅

Phase 5: Service (⭐️⭐️⭐️⭐️) - 완료
  - BlockManagementService ✅
  - BlockPropertyService ✅
  - BlockToolService ✅

Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 부분 완료
  - createAndMountBlockAction ✅ (Canvas Management Domain)
  - updateBlockPropertyAction ✅
  - updateBlockTitleAction ✅
  - executeBlockToolAction ✅
  - manageCustomPropertyAction ❌ (미구현)
  - manageMediaAction ❌ (미구현)

Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 부분 완료
  - 블록 생성 시나리오 ✅
  - 블록 속성 업데이트 시나리오 ✅
  - 커스텀 속성 관리 시나리오 ❌ (Server Actions 미구현으로 제한적)
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
  - 지원되는 블록 타입 검증 (youtube, python, markdown, image, file, link, shape, page_mention, latex, github_pr, react_component)
  - 타입별 메타데이터 스키마 검증 규칙 제공
  - 타입별 기본 속성 스키마 제공
  - 타입별 툴 목록 제공
- **에러 처리**: 지원되지 않는 타입 시 `INVALID_BLOCK_TYPE` 에러 발생
- **비즈니스 규칙**: enum으로 정의된 타입만 허용

**사용 시나리오**:
- 블록 생성 시 타입 선택 검증
- 메타데이터 스키마 검증 시 타입별 규칙 적용
- Canvas 렌더링 시 타입별 컴포넌트 결정
- 블록 툴 실행 시 타입별 툴 목록 제공

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

#### PropertyType VO

- **파일 위치**: `src/domains/block-management/shared/value-objects/property-type.vo.ts`
- **역할**: 커스텀 속성 타입의 유효성을 검증하고 타입별 검증 규칙을 제공
- **주요 기능**:
  - 지원되는 속성 타입 검증 (text, url, email, phone, select, multiselect, status, datetime, media, profile)
  - 타입별 값 검증 규칙 제공
  - 타입별 기본 설정 제공
  - 프로필 속성 워크스페이스 멤버 검증
  - 멀티선택 속성 배열 값 검증
- **에러 처리**: 지원되지 않는 타입 시 `INVALID_PROPERTY_TYPE` 에러 발생
- **비즈니스 규칙**: enum으로 정의된 타입만 허용

**사용 시나리오**:
- 커스텀 속성 생성 시 타입 선택 검증
- 속성 값 설정 시 타입별 값 검증
- 프로필 속성 멤버 검증

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

#### MediaURL VO

- **파일 위치**: `src/domains/block-management/shared/value-objects/media-url.vo.ts`
- **역할**: 미디어 파일 URL의 유효성을 검증하고 파일 정보를 캡슐화
- **주요 기능**:
  - URL 형식 유효성 검사
  - 파일 타입 검증 (image, file)
  - 파일 크기 검증 (이미지 10MB, 파일 50MB)
  - MIME 타입 검증
- **에러 처리**: 잘못된 URL 형식 시 `INVALID_MEDIA_URL` 에러 발생
- **비즈니스 규칙**: 지원되는 MIME 타입만 허용, 파일 크기 제한 준수

**사용 시나리오**:
- 미디어 파일 업로드 시 URL 검증
- 파일 크기 및 타입 검증
- Supabase Storage Public URL 생성

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
  - properties: JSONB 속성 값 (변경 가능)
  - customProperties: JSONB 커스텀 속성 정의 (변경 가능)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
  - deletedAt: 삭제 시각 (소프트 삭제용, 변경 가능)
- **주요 메서드** (실제 구현 기준):
  **블록 생명주기**:
  - create(): Block 생성 (BlockPropertiesFactory로 타입별 기본 속성 초기화)
  - update(): 블록 정보 업데이트 (title, properties)
  - updateBlockType(): 블록 타입 변경 및 기본 속성 재설정
  - duplicate(): 블록 복제 (새로운 BlockId 생성)
  - markAsDeleted(): 소프트 삭제 처리 (deletedAt 설정)
  - restore(): 삭제 취소 (deletedAt 제거)
  
  **커스텀 속성 관리**:
  - addCustomPropertyDefinition(): 커스텀 속성 추가 (updatedAt 갱신)
  - updateCustomPropertyDefinition(): 커스텀 속성 업데이트 (updatedAt 갱신)
  - removeCustomPropertyDefinition(): 커스텀 속성 삭제 (updatedAt 갱신)
  - getCustomProperty(): 특정 커스텀 속성 조회
  
  **속성 조회**:
  - getPropertyValue(): 특정 속성 값 조회
  - getAllProperties(): 모든 속성 값 조회
  - getDefaultProperties(): 블록 타입별 기본 속성 조회
  
  **블록 툴**:
  - getAvailableTools(): 사용 가능한 툴 목록 반환
  - supportsTool(): 특정 툴 지원 여부 확인
  
  **참고**: 
  - 미디어 업로드, 블록 툴 실행은 BlockToolService에서 별도 처리
  - 속성 값 검증은 BlockPropertiesVO Value Objects에서 처리
- **비즈니스 규칙**: 
  - 타입 변경 시 메타데이터 자동 재검증
  - 삭제된 블록은 수정 불가
  - 커스텀 속성 최대 50개 제한
  - 정의-값 동시 업데이트

**사용 시나리오**:
- 블록 생성 시 모든 필드 검증
- 블록 타입 변경 시 메타데이터 스키마 재검증
- 커스텀 속성 관리 (추가, 수정, 삭제)
- 속성 값 설정 및 타입별 검증
- 미디어 파일 업로드 및 관리
- 블록 툴 실행 (사용자/AI)
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
- **주요 메서드** (실제 구현 기준):
  **Aggregate 레벨**:
  - create(): Block 생성 및 BlockCreated 이벤트 발행
  - update(): Block 업데이트 및 BlockUpdated 이벤트 발행
  - updateProperty(): 블록 속성 업데이트 (properties.xxx 경로만) 및 BlockPropertyUpdated 이벤트 발행
  - delete(): 소프트 삭제 및 BlockDeleted 이벤트 발행
  - duplicate(): 블록 복제 및 BlockDuplicated 이벤트 발행
  - restore(): 삭제 취소 및 BlockUpdated 이벤트 발행
  - getBlock(): 현재 Block Entity 반환
  - getUncommittedEvents(): 발행된 이벤트 목록 반환
  - markEventsAsCommitted(): 이벤트 커밋 처리
  
  **참고**: 
  - 커스텀 속성 관리: Block Entity 메서드 (addCustomPropertyDefinition, updateCustomPropertyDefinition, removeCustomPropertyDefinition)
  - 미디어 업로드, 블록 툴 실행: BlockToolService에서 별도 처리 (Aggregate 레벨 아님)
- **비즈니스 로직** (실제 구현 기준): 
  - 블록 타입별 기본 속성 초기화 (BlockPropertiesFactory 사용)
  - 워크스페이스 격리 (RLS 정책, Application 레벨 verifyAccess)
  - 삭제된 블록 수정 불가 검증
  - properties.xxx 경로만 속성 업데이트 허용
  - 커스텀 속성 개수 제한 (최대 50개 - Entity 레벨, 추후 구현)
  - 타입별 속성 값 검증 (BlockPropertiesVO Value Objects에서 처리)
  - 블록 툴 지원 여부 확인 (Block Entity 레벨)
  - 참고: 프로필 속성 멤버 검증, 미디어 파일 검증은 미구현
- **불변식(Invariants)**:
  - 블록은 반드시 하나의 워크스페이스에 속해야 함
  - 블록 타입은 지원되는 타입만 허용
  - 삭제된 블록은 수정할 수 없음
  - 블록당 최대 50개의 커스텀 속성만 가질 수 있음
  - custom_properties(정의)와 properties(값)는 동시에 업데이트되어야 함
  - 속성 값은 속성 타입에 맞는 형식이어야 함 (멀티선택은 배열 형식)
  - 프로필 속성은 워크스페이스 멤버만 할당 가능
  - 이미지는 최대 10MB, 파일은 최대 50MB까지만 업로드 가능
  - 툴 실행 시 사용자 권한 확인이 필요
  - 툴 실행 타임아웃은 30초로 제한

**사용 시나리오**:
- 블록 생성 시 모든 비즈니스 규칙 검증 후 이벤트 발행
- 블록 수정 시 타입별 스키마 재검증
- 커스텀 속성 관리 시 정의-값 동시 업데이트
- 속성 값 설정 시 타입별 검증
- 미디어 파일 업로드 시 크기/MIME 타입 검증
- 블록 툴 실행 시 권한 확인 및 결과 파싱
- 삭제 시 소프트 삭제로 처리하여 Canvas 호환성 유지

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 0-4 모든 시나리오

---

### 4. Commands & Events 수도코드

#### Commands (실제 구현 기준 - 5개)

**블록 생명주기**:
- **CreateBlockCommand**: 블록 생성 (blockId, userId, workspaceId, blockType, title)
- **UpdateBlockCommand**: 블록 업데이트 (blockId, updateData: {title?, properties?})
- **UpdateBlockPropertyCommand**: 블록 속성 업데이트 (blockId, propertyPath, value, workspaceId)
  - blockId: 블록 ID
  - propertyPath: 속성 경로 (properties.xxx 형태만 지원)
  - value: 새로운 속성 값
  - workspaceId: 블록 소유권 검증용
- **DeleteBlockCommand**: 블록 삭제 (blockId)
- **DuplicateBlockCommand**: 블록 복제 (userId)

**참고**: 
- 커스텀 속성 관리는 Block Entity 메서드로 직접 처리 (Command 패턴 없음)
- 미디어 관리, 블록 툴 실행은 BlockToolService에서 별도 처리 (Command 패턴 없음)

#### Events (실제 구현 기준 - 5개)

**블록 생명주기**:
- **BlockCreatedEvent**: 블록이 생성되었다
  - blockId, blockType, title, properties, customProperties, workspaceId, userId
- **BlockUpdatedEvent**: 블록이 업데이트되었다
  - blockId, updateData
- **BlockPropertyUpdatedEvent**: 블록 속성이 업데이트되었다
  - blockId, propertyPath (properties.xxx 형태만), oldValue, newValue
  - 참고: userId는 현재 이벤트에 포함되지 않음 (필요 시 추후 추가)
- **BlockDeletedEvent**: 블록이 삭제되었다
  - blockId, workspaceId
- **BlockDuplicatedEvent**: 블록이 복제되었다
  - originalBlockId, duplicatedBlockId

**참고**: 
- 커스텀 속성, 미디어, 블록 툴 관련 이벤트는 현재 Aggregate 레벨에서 발생하지 않음
- 커스텀 속성 변경은 Entity 레벨에서 처리되며 Service에서 로깅으로 대체
- 미디어 및 블록 툴 실행은 BlockToolService에서 별도 처리 (이벤트 발행 없음)

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
  - INVALID_PROPERTY_TYPE: 지원되지 않는 속성 타입일 때
  - INVALID_MEDIA_URL: 잘못된 미디어 URL일 때
  - WORKSPACE_ACCESS_DENIED: 워크스페이스 접근 권한이 없을 때
  - BLOCK_ALREADY_DELETED: 이미 삭제된 블록을 수정하려 할 때
  - CUSTOM_PROPERTY_LIMIT_EXCEEDED: 커스텀 속성 개수 제한 초과
  - PROPERTY_TYPE_MISMATCH: 속성 타입과 값이 맞지 않을 때
  - PROFILE_PROPERTY_INVALID_MEMBER: 프로필 속성에 유효하지 않은 멤버 할당
  - MEDIA_FILE_SIZE_EXCEEDED: 미디어 파일 크기 제한 초과
  - MEDIA_FILE_TYPE_NOT_SUPPORTED: 지원되지 않는 미디어 파일 타입
  - BLOCK_TOOL_EXECUTION_FAILED: 블록 툴 실행 실패
  - BLOCK_TOOL_TIMEOUT: 블록 툴 실행 타임아웃
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
  - findBlocksByPropertyValue(): 속성 값으로 블록 검색
  - findBlocksByCustomProperty(): 커스텀 속성으로 블록 검색
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **RLS 정책**: 워크스페이스 멤버십 기반 데이터 접근 제어
- **특징**:
  - Aggregate ↔ DB 모델 간 변환 로직 포함
  - 트랜잭션 지원
  - RLS(Row Level Security) 자동 적용
  - Canvas JOIN 최적화를 위한 인덱스 활용
  - JSONB GIN 인덱스 활용

**사용 시나리오**:
- Service Layer에서 Aggregate 저장/조회
- 워크스페이스별 데이터 접근 권한 제어
- Canvas Management Domain에서 직접 JOIN 조회 지원
- 속성 기반 블록 검색

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

### 2. ACL (Anti-Corruption Layer) 수도코드

#### SupabaseStorageAdapter

- **파일 위치**: `src/domains/block-management/infrastructure/acl/supabase-storage.adapter.ts`
- **역할**: Supabase Storage와 Block Management Domain 간 데이터 변환 레이어
- **주요 메서드**:
  - uploadFile(): 파일 업로드 및 MediaURL 반환
  - getPublicURL(): Public URL 생성
  - deleteFile(): 파일 삭제 (선택적)
  - validateFileSize(): 파일 크기 검증
  - validateMimeType(): MIME 타입 검증
- **특징**:
  - Supabase Storage API를 도메인 모델로 추상화
  - 파일 크기/MIME 타입 검증
  - 재시도 로직 (최대 3회)
  - 타입 안전성 보장
- **의존성**: Supabase Storage Client, Block Management 도메인 모델

**사용 시나리오**:
- 미디어 파일 업로드 시 Supabase Storage 연동
- 파일 크기/MIME 타입 검증
- Public URL 생성 및 반환

**우선순위**: ⭐️⭐️⭐️⭐️  
**Software Design 참조**: ACL 섹션

#### SupabaseAuthAdapter

- **파일 위치**: `src/domains/block-management/infrastructure/acl/supabase-auth.adapter.ts`
- **역할**: Supabase Auth와 Block Management Domain 간 데이터 변환 레이어
- **주요 메서드**:
  - getCurrentUser(): 현재 사용자 정보 조회
  - getUserById(): 사용자 ID로 정보 조회
  - validateWorkspaceAccess(): 워크스페이스 접근 권한 검증
  - getWorkspaceMembers(): 워크스페이스 멤버 목록 조회
- **특징**:
  - Supabase Auth API를 도메인 모델로 추상화
  - 사용자 인증 및 권한 검증
  - 워크스페이스 멤버십 확인
  - 타입 안전성 보장
- **의존성**: Supabase Auth Client, Block Management 도메인 모델

**사용 시나리오**:
- 블록 생성 시 사용자 인증 확인
- 워크스페이스 접근 권한 검증
- 프로필 속성 멤버 검증

**우선순위**: ⭐️⭐️⭐️⭐️  
**Software Design 참조**: ACL 섹션

#### WorkspaceManagementACL

- **파일 위치**: `src/domains/block-management/infrastructure/acl/workspace-management.acl.ts`
- **역할**: Workspace Management Domain과 Block Management Domain 간 권한 확인 레이어
- **주요 메서드**:
  - validateWorkspaceAccess(): 워크스페이스 접근 권한 검증
  - getWorkspaceMembers(): 워크스페이스 멤버 목록 조회
  - validateMemberExists(): 멤버 존재 확인
- **특징**:
  - 외부 워크스페이스 API 호출을 도메인 모델로 추상화
  - 권한 검증 로직 캡슐화
  - 타입 안전성 보장
- **의존성**: Workspace Management Domain API, Block Management 도메인 모델

**사용 시나리오**:
- 블록 생성 시 워크스페이스 접근 권한 확인
- RLS 정책에서 워크스페이스 멤버십 검증
- 프로필 속성 멤버 검증
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
  - properties: 속성 값 요약
  - customProperties: 커스텀 속성 정의 요약
  - createdAt: 생성 시각
  - updatedAt: 수정 시각
- **주요 메서드**:
  - getBlocksByWorkspace(): 워크스페이스별 블록 목록 조회
  - getBlocksByType(): 타입별 블록 목록 조회
  - searchBlocks(): 블록 검색 (메타데이터 포함)
  - getBlocksByPropertyValue(): 속성 값으로 블록 검색
  - getBlocksByCustomProperty(): 커스텀 속성으로 블록 검색
- **DB 최적화**:
  - 인덱스 활용: workspace_id, block_type, created_at에 복합 인덱스
  - JSONB GIN 인덱스: properties, custom_properties
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
- 속성 기반 블록 검색

---

## 🚀 Application Layer

### 1. Service 수도코드

#### BlockManagementService

- **파일 위치**: `src/domains/block-management/application/services/block-management.service.ts`
- **역할**: Block Management의 비즈니스 유스케이스를 조율하고 실행하는 Application Service
- **주요 의존성**:
  - BlockRepository: Block Aggregate 영속성 관리
  - SupabaseStorageAdapter: 미디어 파일 업로드
  - SupabaseAuthAdapter: 사용자 인증
  - WorkspaceManagementACL: 워크스페이스 접근 권한 검증
  - EventBus: 도메인 이벤트 발행 (선택적)
- **주요 메서드**:
  - createBlock(): CreateBlockCommand 처리 및 Block 생성
  - deleteBlock(): DeleteBlockCommand 처리 및 Block 소프트 삭제
  - addCustomProperty(): AddCustomPropertyCommand 처리
  - changePropertyType(): ChangePropertyTypeCommand 처리
  - reorderProperty(): ReorderPropertyCommand 처리
  - togglePropertyVisibility(): TogglePropertyVisibilityCommand 처리
  - deleteCustomProperty(): DeleteCustomPropertyCommand 처리
  - setPropertyValue(): SetPropertyValueCommand 처리
  - updateBlockProperty(): UpdateBlockPropertyCommand 처리
  - clearPropertyValue(): ClearPropertyValueCommand 처리
  - uploadMedia(): UploadMediaCommand 처리
  - deleteMediaFile(): DeleteMediaFileCommand 처리
  - executeBlockTool(): ExecuteBlockToolCommand 처리
  - executeBlockToolByAI(): ExecuteBlockToolByAICommand 처리
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
- 커스텀 속성 관리
- 미디어 파일 관리
- 블록 툴 실행

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Service 통합 테스트 케이스

---

### 2. Server Actions 수도코드

#### createAndMountBlockAction (실제 구현 기준)

- **파일 위치**: `src/domains/canvas-management/actions/block.actions.ts`
- **역할**: 블록 생성 및 Canvas 마운팅 통합 Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - Canvas Management와 Block Management 통합 처리
  - Command 객체 생성 및 Service 메서드 호출
  - 도메인 모델 → DTO 직렬화
- **입력**: CreateAndMountBlockRequest (workspaceId, orgId, pageId, blockType, position, size)
- **출력**: BlockCreatedAndMountedDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 권한 부족 → WorkspaceAccessDeniedError
  - 도메인 규칙 위반 → BlockManagementError
- **특징**:
  - `'use server'` 지시어 사용
  - Canvas Management Domain에 구현됨
  - BlockManagementService와 CanvasBlockMountService 통합

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 워크스페이스 권한 확인: verifyAccess()로 접근 권한 검증
3. 의존성 주입: Repository, Service 인스턴스 생성
4. 블록 생성 및 마운팅: CanvasBlockMountService.createAndMountBlock() 호출
5. DTO 직렬화: Block Aggregate + BlockMount Aggregate → DTO 변환
6. 결과 반환: ActionResult<BlockCreatedAndMountedDTO> 형식

#### updateBlockTitleAction (실제 구현 기준)

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 제목 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: UpdateBlockTitleRequest (blockId, title, workspaceId, orgId)
- **출력**: BlockTitleUpdatedDTO
- **처리 흐름**: 
  1. 인증 확인 및 권한 검증
  2. Block Entity 직접 업데이트 (update 메서드)
  3. Repository에 저장
  4. DTO 반환

참고: updateBlockAction은 현재 별도 구현 없이 updateBlockTitleAction과 updateBlockPropertyAction으로 분리됨

#### updateBlockPropertyAction (실제 구현 기준)

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 속성 업데이트 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - UpdateBlockPropertyCommand 처리
  - 속성 경로 검증 (properties.xxx 형태만 지원)
  - 타입별 값 검증 (BlockPropertiesVO Value Objects에서 처리)
- **입력**: UpdateBlockPropertyRequest (blockId, propertyPath, value, workspaceId, orgId)
- **출력**: BlockPropertyUpdatedDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**:
  - 인증 실패 → UnauthorizedError
  - 블록 없음 → BlockNotFoundError
  - 삭제된 블록 → BlockAlreadyDeletedError
  - 잘못된 속성 경로 → InvalidPropertyPathError (properties.xxx만 허용)
- **처리 흐름**:
  1. 인증 확인: Supabase Auth로 현재 사용자 확인
  2. 워크스페이스 권한 확인: verifyAccess()로 접근 권한 검증
  3. 입력 파라미터 검증: Zod 스키마로 런타임 검증
  4. UpdateBlockPropertyCommand 생성 (workspaceId 포함 - 소유권 검증용)
  5. BlockPropertyService.updateProperty() 호출
  6. BlockAggregate.updateProperty() 호출 (properties.xxx 경로만 처리)
  7. 도메인 이벤트 처리 (BlockPropertyUpdatedEvent 발생)
  8. DTO 직렬화 및 반환
- **참고**: 
  - userId는 현재 이벤트에 포함되지 않음 (필요 시 추후 추가)
  - 프로필 속성 멤버 검증은 현재 미구현

#### manageCustomPropertyAction (미구현)

- **파일 위치**: `src/domains/block-management/actions/property.actions.ts` (파일 없음)
- **역할**: 커스텀 속성 관리 기능을 제공하는 Next.js Server Action
- **현재 상태**: 
  - Frontend Hook(useSchemaFieldEditor)에서 호출하지만 실제 파일이 존재하지 않음
  - Block Entity 메서드(addCustomPropertyDefinition 등)는 구현되어 있으나 Server Action 레벨에서 연동 필요
- **필요한 구현**:
  - createCustomPropertyAction: 커스텀 속성 추가
  - updateCustomPropertyAction: 커스텀 속성 업데이트
  - deleteCustomPropertyAction: 커스텀 속성 삭제
- **참고**: 현재는 Frontend에서 Optimistic Update만 동작하며 백엔드 저장은 불가

#### manageMediaAction (미구현)

- **파일 위치**: `src/domains/block-management/actions/media.actions.ts` (파일 없음)
- **역할**: 미디어 파일 관리 기능을 제공하는 Next.js Server Action
- **현재 상태**: 
  - MediaURL Value Object는 구현되어 있으나 Server Action은 미구현
  - Supabase Storage 연동 로직 미구현
- **필요한 구현**:
  - uploadMediaAction: 미디어 파일 업로드 및 Public URL 생성
  - deleteMediaAction: 미디어 파일 삭제 (properties에서 URL 제거)

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
- `useCallback`: 블록 툴 실행 최적화

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
- 커스텀 속성 관리 → manageCustomPropertyAction → 실시간 업데이트
- 미디어 파일 관리 → manageMediaAction → 진행률 표시

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
3. PropertyType VO
4. MediaURL VO

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Block Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. BlockAggregate

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. BlockRepository (통합 테스트)

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. BlockManagementService (통합 테스트)

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 실제 구현 기준
1. createAndMountBlockAction (Canvas Management Domain에 구현) ✅
   - 파일: `canvas-management/actions/block.actions.ts`
   - 블록 생성 및 Canvas 마운팅 통합 처리
2. updateBlockPropertyAction ✅
   - 파일: `block-management/actions/block.actions.ts`
   - 블록 속성 업데이트 (properties.xxx 경로만)
3. updateBlockTitleAction ✅
   - 파일: `block-management/actions/block.actions.ts`
   - 블록 제목 업데이트
4. executeBlockToolAction ✅
   - 파일: `block-management/actions/tool.actions.ts`
   - 블록 툴 실행
5. manageCustomPropertyAction ❌ (미구현 - property.actions.ts 파일 없음)
   - Frontend Hook에서 호출하나 실제 Server Action 파일 없음
6. manageMediaAction ❌ (미구현)
   - MediaURL Value Object만 구현, Server Action 및 Storage 연동 미구현

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 블록 생성 시나리오
2. 블록 속성 업데이트 시나리오 (블록 마운트 툴바에서 색상 변경)
3. 커스텀 속성 관리 시나리오
4. 미디어 파일 관리 시나리오
5. 블록 툴 실행 시나리오
6. 블록 삭제 시나리오
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
- [x] Process Model의 모든 시나리오가 구현 수도코드로 반영되었는가? (생성, 수정, 삭제, 커스텀 속성, 미디어, 툴)
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

### Software Design 완전 반영 검증 (실제 구현 기준)
- [x] 5개 Commands가 모두 구현 수도코드로 작성되었는가? (CreateBlock, UpdateBlock, UpdateBlockProperty, DeleteBlock, DuplicateBlock)
- [x] 5개 Events가 모두 구현 수도코드로 작성되었는가? (BlockCreated, BlockUpdated, BlockPropertyUpdated, BlockDeleted, BlockDuplicated)
- [x] 핵심 Invariants가 구현 수도코드로 반영되었는가? (워크스페이스 격리, 삭제된 블록 수정 불가, properties.xxx 경로 검증)
- [x] JSONB Properties 구조가 구현 수도코드로 반영되었는가? (properties, custom_properties 분리)
- [x] BlockPropertiesVO Value Objects 구조가 반영되었는가? (타입별 Properties Value Object)
- 참고: 커스텀 속성, 미디어, 블록 툴 관련 Commands/Events는 Entity나 Service 레벨에서 처리됨

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