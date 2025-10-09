# [Domain Name] - Technical Specification

Software Design을 기반으로 한 구체적인 구현 가이드입니다.

---

## 🎯 Implementation Overview

### 개발 우선순위
1. **Phase 1**: [핵심 기능 구현]
2. **Phase 2**: [고급 기능 구현]
3. **Phase 3**: [통합 및 최적화]

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### [EntityName]Name Value Object
- **파일 위치**: `src/domains/[domain]/shared/value-objects/[entity-name]-name.vo.ts`
- **역할**: [EntityName] 이름의 유효성을 검증하고 도메인 로직을 캡슐화
- **주요 기능**:
  - 이름 형식 유효성 검사 (길이 제한: 1-100자)
  - 이름 패턴 검증 (영문, 숫자, 공백, 하이픈, 언더스코어만 허용)
  - 다른 [EntityName]Name 객체와의 동등성 비교
  - URL 생성을 위한 슬러그 변환 기능
- **에러 처리**: 잘못된 이름 형식 시 ValidationError 발생
- **비즈니스 규칙**: 이름은 필수이며 1-100자 사이여야 함

#### 사용 시나리오
- 사용자가 [EntityName] 이름을 입력할 때 즉시 검증
- [EntityName] 이름 변경 시 기존 이름과 새 이름 비교
- URL 생성을 위한 슬러그 변환

---

### 2. Entities 구현

#### [EntityName] Entity
- **파일 위치**: `src/domains/[domain]/shared/entities/[entity-name].entity.ts`
- **역할**: [EntityName] 도메인 엔티티로 [EntityName]의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: [EntityName]Id Value Object로 [EntityName] 고유 식별자
  - organizationId: 조직 식별자 (불변)
  - name: [EntityName]Name Value Object로 이름
  - description: 설명 (선택적)
  - createdBy: 생성자 식별자 (불변)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateName(): [EntityName] 이름 업데이트
  - updateDescription(): 설명 업데이트
  - canBeDeletedBy(): 삭제 권한 확인
- **비즈니스 규칙**: 이름이나 설명 변경 시 updatedAt 자동 갱신

#### 사용 시나리오
- [EntityName] 생성 시 모든 필드 검증
- 이름 변경 시 변경 시간 자동 업데이트
- 삭제 권한 확인 시 생성자 ID 비교

---

### 3. Aggregates 구현

#### [EntityName]Aggregate
- **파일 위치**: `src/domains/[domain]/shared/aggregates/[entity-name].aggregate.ts`
- **역할**: [EntityName] 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - [EntityName] 생성 시 모든 관련 객체 동시 생성
  - 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - 관련 엔티티들의 일관성 보장
- **주요 메서드**:
  - create[EntityName](): [EntityName] 생성 및 관련 객체 자동 생성
  - validate[EntityName]Creation(): 생성 규칙 검증
  - create[RelatedEntity](): 관련 엔티티 생성
- **비즈니스 로직**: [EntityName] 생성 시 기본 [RelatedEntity] 자동 생성, 생성자 권한 설정

#### 사용 시나리오
- [EntityName] 생성 시 모든 관련 객체 동시 생성
- 비즈니스 규칙 위반 시 즉시 예외 발생
- 생성된 모든 이벤트를 한 번에 반환

---

### 4. Commands 구현

#### Create[EntityName]Command
- **파일 위치**: `src/domains/[domain]/shared/commands/index.ts`
- **역할**: [EntityName] 생성 의도를 표현하는 Command 객체
- **주요 속성**:
  - organizationId: 조직 식별자 (필수)
  - name: [EntityName] 이름 (필수, 1-100자)
  - description: 설명 (선택적, 최대 1000자)
  - createdBy: 생성자 식별자 (필수)
  - templateId: 템플릿 식별자 (선택적)
- **검증 규칙**:
  - organizationId는 유효한 UUID 형식이어야 함
  - name은 1-100자 사이여야 함
  - description은 최대 1000자까지 허용
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

#### 사용 시나리오
- Server Actions에서 사용자 입력을 Command로 변환
- Aggregate 실행 전 입력값 검증
- 이벤트 소싱에서 커맨드 저장

---

### 5. Events 구현

#### [EntityName]CreatedEvent
- **파일 위치**: `src/domains/[domain]/shared/events/index.ts`
- **역할**: [EntityName] 생성 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('[EntityName]Created')
  - aggregateId: 이벤트를 발생시킨 Aggregate ID
  - data: 이벤트 데이터 (생성된 [EntityName] 정보)
- **이벤트 데이터**:
  - [entityName]Id: 생성된 [EntityName] ID
  - organizationId: 소속 조직 ID
  - name: [EntityName] 이름
  - description: 설명 (선택적)
  - createdBy: 생성자 ID
  - createdAt: 생성 시각
  - templateId: 사용된 템플릿 ID (선택적)
- **특징**: 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

#### 사용 시나리오
- [EntityName] 생성 완료 시 Visual Canvas에 빈 캔버스 생성 요청
- 사용자에게 생성 완료 알림 전송
- 분석 시스템에 사용자 활동 로그 기록

---

### 6. Error Types 구현

#### [DomainName]Error 클래스
- **파일 위치**: `src/domains/[domain]/shared/errors/[domain-name].error.ts`
- **역할**: [DomainName] 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 ([DomainName]ErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### [DomainName]ErrorCode 타입
- **역할**: [DomainName] 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - [ENTITY_NAME]_NOT_FOUND: [EntityName]을 찾을 수 없을 때
  - [ENTITY_NAME]_ALREADY_EXISTS: 이미 존재하는 [EntityName]일 때
  - INVALID_[ENTITY_NAME]_NAME: 잘못된 [EntityName] 이름일 때
  - [ENTITY_NAME]_LIMIT_EXCEEDED: [EntityName] 생성 한도 초과 시
  - UNAUTHORIZED_ACCESS: 권한 부족 시
  - DATABASE_CONNECTION_FAILED: 데이터베이스 연결 실패 시
  - EXTERNAL_SERVICE_UNAVAILABLE: 외부 서비스 사용 불가 시

#### 에러 메시지 매핑
- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 한국어 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

#### 사용 시나리오
- [EntityName] 생성 한도 초과 시 사용자에게 친화적 메시지
- 데이터베이스 연결 실패 시 시스템 로그 기록
- 권한 부족 시 적절한 에러 코드 반환

---

### 7. Services 구현

#### [EntityName]Service
- **파일 위치**: `src/domains/[domain]/backend/services/[entity-name].service.ts`
- **역할**: [EntityName] 도메인의 핵심 비즈니스 로직을 담당하는 서비스 클래스
- **주요 기능**:
  - [EntityName] 생성 및 업데이트 관리
  - 권한 검증 및 비즈니스 규칙 실행
  - 크로스 애그리거트 로직 처리
  - 외부 시스템과의 연동 처리
- **주요 메서드**:
  - create[EntityName](): [EntityName] 생성 및 관련 객체 자동 생성
  - validate[EntityName]Limits(): 생성 한도 검증
  - update[EntityName](): [EntityName] 정보 업데이트
- **의존성**: [EntityName]Repository, AuthService, OrganizationService
- **비즈니스 로직**: [EntityName] 생성 시 권한 검증, 한도 확인, 관련 객체 생성

#### 사용 시나리오
- [EntityName] 생성 시 권한과 한도 검증
- 여러 도메인의 서비스들과 협력
- 복잡한 비즈니스 로직 실행

---

### 8. Repository 구현

#### [EntityName]Repository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/[domain]/backend/repositories/interfaces/[entity-name].repository.interface.ts`
- **구현체 위치**: `src/domains/[domain]/backend/repositories/implementations/drizzle-[entity-name].repository.ts`
- **역할**: [EntityName] 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - [EntityName] ID로 [EntityName] 조회 (findById)
  - [EntityName] 저장 및 업데이트 (save)
  - 조직 ID로 [EntityName] 목록 조회 (findByOrganizationId)
  - 소유자 ID로 [EntityName] 목록 조회 (findByOwnerId)
  - [EntityName] 삭제 (delete)
  - 조직별 [EntityName] 개수 조회 (countByOrganization)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **RLS 지원**: Supabase Row Level Security를 통해 사용자별 데이터 격리 보장

#### 사용 시나리오
- Aggregate에서 상태 변경 후 저장
- 다양한 조건으로 [EntityName] 조회
- 통계 데이터 수집 (개수, 사용량 등)

---

### 9. Anti-Corruption Layer 구현

#### [ExternalSystem]ACL 클래스
- **파일 위치**: `src/domains/[domain]/backend/anti-corruption-layers/[external-system]-acl.ts`
- **역할**: [ExternalSystem]와 도메인 모델 간의 데이터 변환을 담당하는 Anti-Corruption Layer
- **주요 기능**:
  - [ExternalSystem] 데이터를 도메인 모델로 변환
  - 도메인 모델을 [ExternalSystem] 형태로 변환
  - 역할 매핑 및 권한 변환
  - 이벤트 변환 및 Webhook 처리
- **주요 메서드**:
  - toDomainUser(): [ExternalSystem] 사용자를 도메인 User 모델로 변환
  - to[ExternalSystem]User(): 도메인 User 모델을 [ExternalSystem] 형태로 변환
  - map[ExternalSystem]Role(): [ExternalSystem] 역할을 도메인 역할로 매핑
  - toDomainEvent(): [ExternalSystem] 이벤트를 도메인 이벤트로 변환
- **특징**: 외부 시스템의 변경사항이 도메인 모델에 영향을 주지 않도록 보호

#### 사용 시나리오
- [ExternalSystem] 사용자 정보를 도메인 User로 변환
- 도메인 이벤트를 [ExternalSystem] Webhook으로 변환
- 외부 API 변경 시 한 곳에서만 수정

---

### 10. Server Actions 구현

#### [EntityName]Management Actions
- **파일 위치**: `src/domains/[domain]/actions/[domain-name].actions.ts`
- **역할**: Next.js Server Actions를 통해 클라이언트에서 호출 가능한 서버 함수들 제공
- **주요 Actions**:
  - create[EntityName]Action(): [EntityName] 생성 및 관련 객체 자동 생성
  - get[Entities]Action(): [EntityName] 목록 조회
  - update[EntityName]Action(): [EntityName] 정보 업데이트
  - delete[EntityName]Action(): [EntityName] 삭제
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공
- **트랜잭션**: 복잡한 작업은 Drizzle 트랜잭션을 사용하여 원자성 보장

#### 사용 시나리오
- 사용자 입력을 받아 도메인 로직 실행
- 생성된 이벤트를 다른 도메인에 전달
- 적절한 에러 응답 반환

---

### 11. React Hooks 구현

#### use[EntityName]Creation Hook
- **파일 위치**: `src/domains/[domain]/frontend/hooks/use-[entity-name]-creation.tsx`
- **역할**: [EntityName] 생성 관련 UI 상태 관리 및 낙관적 업데이트를 담당하는 커스텀 훅
- **주요 기능**:
  - [EntityName] 생성 시 낙관적 업데이트
  - 서버 액션 호출 및 응답 처리
  - 로딩 상태 관리
  - 에러 처리 및 롤백
- **주요 메서드**:
  - create[EntityName](): [EntityName] 생성 및 낙관적 업데이트
  - handleSuccess(): 성공 시 실제 데이터로 교체
  - handleError(): 실패 시 낙관적 항목 제거
- **특징**: useOptimistic과 useTransition을 활용하여 사용자 경험 최적화

#### 사용 시나리오
- [EntityName] 생성 버튼 클릭 시 즉시 UI 업데이트
- 서버 응답 대기 중 로딩 상태 표시
- 실패 시 이전 상태로 롤백

---

## 🧪 Testing Strategy

### 1. Unit Tests

#### Aggregate 테스트
- **파일 위치**: `src/domains/[domain]/shared/aggregates/__tests__/[entity-name].aggregate.test.ts`
- **역할**: [EntityName]Aggregate의 핵심 비즈니스 로직을 검증하는 단위 테스트
- **주요 테스트 케이스**:
  - create[EntityName](): [EntityName] 생성 및 이벤트 발생 검증
  - validate[EntityName]Creation(): 생성 규칙 검증 로직 검증
  - 비즈니스 규칙 위반 시 예외 발생 검증
- **Mock 사용**: 외부 의존성을 Mock으로 생성하여 테스트

### 2. Integration Tests

#### Server Actions 테스트
- **파일 위치**: `src/domains/[domain]/actions/__tests__/[domain-name].actions.test.ts`
- **역할**: Server Actions의 전체 플로우를 검증하는 통합 테스트
- **주요 테스트 케이스**:
  - create[EntityName]Action(): [EntityName] 생성 및 관련 객체 생성 플로우
  - get[Entities]Action(): [EntityName] 목록 조회 플로우
  - update[EntityName]Action(): [EntityName] 정보 업데이트 플로우
- **테스트 환경**: 테스트용 Supabase 클라이언트를 사용하여 실제 데이터베이스 연동 테스트

### 3. Mocking 전략
- **Repository Mocking**: 데이터 접근 계층을 Mock으로 대체
- **Service Mocking**: 외부 서비스 의존성을 Mock으로 대체
- **External Service Mocking**: 외부 시스템 연동을 Mock으로 대체

---

이 Technical Specification은 [Domain Name]의 구현을 위한 완전한 가이드입니다.
