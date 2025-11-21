# Technical Specification: [Domain Name] Domain

## 🎯 개요

**도메인**: [Domain Name]  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: YYYY-MM-DD  
**버전**: v1.0

**Testing Strategy 참조**: `04-testing-strategy.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: `07-tdd-implementation.md` (실제 구현)

---

> **가이드 참조**: `docs/event-domain-design/guide/05-technical-specification-guide.md`  
> **작성 시점**: Testing Strategy 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

[이 도메인의 구현 전략을 간략히 설명]

### Testing Strategy 연결점

- **입력**: `04-testing-strategy.md` - [주요 테스트 케이스 N개]
- **입력**: `03-software-design.md` - [주요 Aggregate M개]
- **출력**: 구현 수도코드 + 테스트 수도코드

### TDD 구현 순서 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - [N]개
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - [M]개
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - [K]개
Phase 4: Repository (⭐️⭐️⭐️⭐️) - [L]개
Phase 5: Service (⭐️⭐️⭐️⭐️) - [P]개
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - [Q]개
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - [R]개
```

---

## 🧩 DDD Components

> **가이드 참조**: Phase 2.2 - DDD 컴포넌트 수도코드 작성

### 1. Value Objects 수도코드

#### [ValueObject1] VO

- **파일 위치**: `src/domains/[domain]/shared/value-objects/[value-object-name].vo.ts`
- **역할**: [ValueObject1]의 유효성을 검증하고 도메인 로직을 캡슐화
- **주요 기능**:
  - [값] 형식 유효성 검사 (길이 제한: [min]-[max]자)
  - [값] 패턴 검증 ([허용 문자 규칙])
  - 다른 [ValueObject1] 객체와의 동등성 비교
  - [추가 비즈니스 로직 메서드]
- **에러 처리**: 잘못된 형식 시 [DomainError] 발생
- **비즈니스 규칙**: [핵심 비즈니스 규칙 설명]

**사용 시나리오**:
- 사용자가 [값]을 입력할 때 즉시 검증
- [값] 변경 시 기존 값과 새 값 비교
- [추가 사용 사례]

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]

---

### 2. Entities 수도코드

#### [Entity1] Entity

- **파일 위치**: `src/domains/[domain]/shared/entities/[entity-name].entity.ts`
- **역할**: [Entity1] 도메인 엔티티로 [Entity1]의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: [Entity1]Id Value Object로 고유 식별자
  - [immutableProp]: [설명] (불변)
  - [mutableProp]: [설명] (변경 가능)
  - createdBy: 생성자 식별자 (불변)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - update[Property](): [속성] 업데이트 및 updatedAt 갱신
  - [businessMethod](): [비즈니스 로직 설명]
  - canBeDeletedBy(): 삭제 권한 확인
- **비즈니스 규칙**: 속성 변경 시 updatedAt 자동 갱신, createdAt은 불변 유지

**사용 시나리오**:
- [Entity1] 생성 시 모든 필드 검증
- 속성 변경 시 변경 시간 자동 업데이트
- 삭제 권한 확인 시 생성자 ID 비교


**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]

---

### 3. Aggregates 수도코드

#### [Aggregate1]

- **파일 위치**: `src/domains/[domain]/shared/aggregates/[aggregate-name].aggregate.ts`
- **역할**: [Aggregate1] 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - [Entity1] 생성 시 모든 관련 객체 동시 생성
  - 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - 관련 엔티티들의 일관성 보장
- **주요 메서드**:
  - create[Aggregate1](): [Aggregate1] 생성 및 [Event]Created 발행
  - [commandMethod](): [Command] 처리 및 [Event] 발행
  - validate[BusinessRule](): [비즈니스 규칙] 검증
  - getUncommittedEvents(): 발행된 이벤트 목록 반환
- **비즈니스 로직**: [핵심 비즈니스 로직 설명]
- **불변식(Invariants)**:
  - [불변식 1]: [설명]
  - [불변식 2]: [설명]

**사용 시나리오**:
- [Aggregate1] 생성 시 모든 관련 객체 동시 생성
- 비즈니스 규칙 위반 시 즉시 예외 발생
- 생성된 모든 이벤트를 한 번에 반환

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]  
**Process Model 매핑**: Scenario [N] - Sequence [M]

---

### 4. Commands & Events 수도코드

#### [Command1]

- **파일 위치**: `src/domains/[domain]/shared/commands/index.ts`
- **역할**: [Command1] 의도를 표현하는 Command 객체
- **주요 속성**:
  - [property1]: [설명] (필수, [제약조건])
  - [property2]: [설명] (선택적, [제약조건])
  - [property3]: [설명]
- **검증 규칙**:
  - [property1]는 [형식] 형식이어야 함
  - [property2]는 [범위] 사이여야 함
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

**사용 시나리오**:
- Server Actions에서 사용자 입력을 Command로 변환
- Aggregate 실행 전 입력값 검증
- 이벤트 소싱에서 커맨드 저장


---

#### [Event1]

- **파일 위치**: `src/domains/[domain]/shared/events/index.ts`
- **역할**: [Event1] 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('[Event1]')
  - aggregateId: 이벤트를 발생시킨 Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - [entityId]: 생성/수정된 엔티티 ID
  - [property1]: [설명]
  - [property2]: [설명]
  - occurredAt: 발생 시각
- **특징**: 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

**사용 시나리오**:
- [작업] 완료 시 [다른 도메인]에 알림
- 사용자에게 완료 알림 전송
- 분석 시스템에 활동 로그 기록


---

### 5. Error Types 수도코드

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
  - [ERROR_CODE_1]: [발생 조건 설명]
  - [ERROR_CODE_2]: [발생 조건 설명]
  - [ERROR_CODE_3]: [발생 조건 설명]
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

> **가이드 참조**: Phase 2.3 - Service/Repository/ACL 수도코드 작성

### 1. Repository 수도코드

#### [Repository1]

- **파일 위치**: `src/domains/[domain]/infrastructure/repositories/[repository-name].repository.ts`
- **역할**: [Aggregate1]의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): Aggregate를 데이터베이스에 저장 (생성/수정)
  - findById(): ID로 Aggregate 조회
  - findBy[Condition](): [조건]으로 여러 Aggregate 조회
  - delete(): Aggregate 삭제 (soft delete 적용)
  - list[Entities]By[Criteria](): [조건]에 맞는 목록 조회 (페이징 지원)
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **RLS 정책**: 사용자 인증 정보 기반 데이터 접근 제어
- **특징**:
  - Aggregate ↔ DB 모델 간 변환 로직 포함
  - 트랜잭션 지원
  - Connection pool 활용
  - RLS(Row Level Security) 자동 적용

**사용 시나리오**:
- Service Layer에서 Aggregate 저장/조회
- 사용자별 데이터 접근 권한 제어
- 트랜잭션 내 여러 Aggregate 동시 저장


**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]

---

### 2. ACL (Anti-Corruption Layer) 수도코드

#### [ExternalSystem]ACL

- **파일 위치**: `src/domains/[domain]/infrastructure/acl/[external-system].acl.ts`
- **역할**: [ExternalSystem]과 [DomainName] 도메인 간 데이터 변환 레이어
- **주요 메서드**:
  - toDomain[Entity](): 외부 시스템 데이터 → 도메인 Entity로 변환
  - toExternal[Entity](): 도메인 Entity → 외부 시스템 데이터로 변환
  - validate[ExternalData](): 외부 데이터 유효성 검증
- **특징**:
  - 외부 시스템의 변화가 도메인에 영향을 주지 않도록 격리
  - 타입 안전성 보장
  - 매핑 로직 캡슐화
- **의존성**: [ExternalSystem] API Client, [DomainName] 도메인 모델

**사용 시나리오**:
- [ExternalSystem] API 응답을 도메인 모델로 변환
- 도메인 모델을 [ExternalSystem]에 전달할 형식으로 변환
- 외부 시스템 변경 시 ACL만 수정하면 됨


**우선순위**: ⭐️⭐️⭐️⭐️  
**Software Design 참조**: ACL 섹션

---

### 3. Read Models 수도코드

#### [ReadModel1]View

- **파일 위치**: `src/domains/[domain]/infrastructure/queries/[read-model-name].query.ts`
- **역할**: [ReadModel1] 조회에 최적화된 Read Model
- **주요 속성**:
  - [property1]: [설명]
  - [property2]: [설명]
  - [nestedData]: 관련 엔티티 정보 (조인 결과)
- **주요 메서드**:
  - get[ReadModel1]View(): 단일 View 조회
  - list[ReadModel1]Views(): 목록 조회 (페이징 지원)
  - count[ReadModel1](): 개수 조회
- **DB 최적화**:
  - 인덱스 활용: [주요 조회 필드]에 복합 인덱스
  - JOIN 최소화: 필요한 필드만 조회
  - 페이징: offset/limit 방식 사용
- **캐싱 전략**:
  - Redis 캐싱 (TTL: [N]분)
  - 키 형식: `[domain]:[read-model]:[params]`
  - 캐시 무효화: 관련 Aggregate 업데이트 시
- **특징**: Write Model과 분리되어 조회 성능에 최적화

**사용 시나리오**:
- 대시보드에서 요약 정보 표시
- 목록 화면에서 페이징 데이터 조회
- 검색 기능에서 여러 필터 조건 적용

**최적화 전략**:
- 캐싱: [Redis/메모리 캐시] (TTL: [N]분)
- 인덱스: [주요 조회 필드]
- 페이징: [1000개 이상 시 처리 방법]

---

## 🚀 Application Layer

> **가이드 참조**: Phase 2.3, 2.4 - Service 및 Server Actions 수도코드

### 1. Service 수도코드

#### [Service1]

- **파일 위치**: `src/domains/[domain]/application/services/[service-name].service.ts`
- **역할**: [Service1]의 비즈니스 유스케이스를 조율하고 실행하는 Application Service
- **주요 의존성**:
  - [Repository1]: [Aggregate1] 영속성 관리
  - [Repository2]: [Aggregate2] 영속성 관리
  - [ExternalService]: 외부 시스템 통신 (선택적)
  - EventBus: 도메인 이벤트 발행 (선택적)
- **주요 메서드**:
  - [methodName](): [Command1] 처리 및 [Aggregate1] 생성/수정
  - [queryMethodName](): 조회 전용 메서드
  - [complexBusinessFlow](): 여러 Aggregate 조율이 필요한 복잡한 비즈니스 플로우
- **트랜잭션**: 하나의 Service 메서드는 하나의 트랜잭션 단위
- **특징**:
  - 얇은 Application Layer: 도메인 로직은 Aggregate에 위임
  - Result 패턴 사용: 함수형 에러 처리
  - 의존성 주입: 테스트 용이성 확보

**처리 흐름**:
1. Command 유효성 검증
2. Repository에서 Aggregate 조회 (필요시)
3. Aggregate 메서드 호출 (도메인 로직 실행)
4. Repository에 Aggregate 저장
5. 도메인 이벤트 발행
6. Result.ok() 또는 Result.err() 반환

**사용 시나리오**:
- Server Actions에서 비즈니스 로직 실행
- 여러 Aggregate 간 조율이 필요한 경우
- 트랜잭션 경계 설정

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]

---

### 2. Server Actions 수도코드

#### [action1]Action

- **파일 위치**: `src/domains/[domain]/actions/[action-name].actions.ts`
- **역할**: [action1] 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - 의존성 주입 패턴으로 Service Layer 활용
  - Command 객체 생성 및 Service 메서드 호출
  - 도메인 모델 → DTO 직렬화 (Value Object → string, Date → ISO string)
  - Next.js 캐시 무효화 (revalidatePath)
- **입력**: [params] ([FormData] 또는 [타입 정의])
- **출력**: DTO ([DTOType])
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 도메인 규칙 위반 → [DomainError]
  - 시스템 에러 → InternalServerError
- **특징**:
  - `'use server'` 지시어 사용
  - Plain Object만 반환 (직렬화 가능)
  - 의존성 주입으로 테스트 용이성 확보

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 의존성 주입: Repository, Service 인스턴스 생성
3. Command 생성: 입력 파라미터 → Command 객체 변환
4. 도메인 로직 실행: Service 메서드 호출
5. DTO 직렬화: 도메인 모델 → 직렬화 가능한 Plain Object
6. 캐시 무효화: revalidatePath 호출 (필요시)
7. 결과 반환: Result<DTO> 형식

**사용 시나리오**:
- 클라이언트 컴포넌트에서 폼 제출
- Server Components에서 데이터 조회
- React Hooks와 결합하여 낙관적 업데이트

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: [섹션 번호]

---

### 3. Cross-Domain 이벤트 처리

#### Event Handler 등록

- **파일 위치**: `src/domains/[domain]/application/event-handlers/index.ts`
- **역할**: 다른 도메인에서 발생한 이벤트를 구독하고 처리
- **주요 핸들러**:
  - on[Event1]: [Event1] 수신 시 [처리 내용]
  - on[Event2]: [Event2] 수신 시 [처리 내용]
- **이벤트 처리 패턴**:
  - 비동기 처리: 이벤트 수신 즉시 반환 (큐 사용)
  - 재시도 로직: 실패 시 [N]회 재시도
  - 멱등성 보장: 동일 이벤트 중복 처리 방지
- **의존성**: EventBus, [DomainName]Service, Repository
- **특징**:
  - 도메인 간 느슨한 결합
  - 이벤트 기반 비동기 통신
  - Eventually Consistent 보장

**처리 흐름**:
1. 이벤트 수신: EventBus로부터 이벤트 전달
2. 이벤트 검증: 필수 데이터 확인
3. 비즈니스 로직 실행: Service 메서드 호출
4. 결과 처리: 성공/실패 로그 기록
5. 실패 시 재시도: Dead Letter Queue로 이동

**사용 시나리오**:
- [OtherDomain]에서 [Event1] 발생 시 [처리 내용]
- 여러 도메인 간 데이터 동기화
- 비동기 알림 발송

---

## 🎨 UI & Hook 전략

> **가이드 참조**: Phase 3.1 - 문서 구조 (섹션 5)

### React Hooks 사용

**사용할 Hook**:
- `useOptimistic`: 낙관적 업데이트 ([사용 사례])
- `useTransition`: 비동기 상태 관리 ([사용 사례])
- `useFormStatus`: 폼 제출 상태 ([사용 사례])

**낙관적 업데이트 로직**:
```typescript
function use[Feature]() {
  const [optimistic[Entities], addOptimistic[Entity]] = useOptimistic(
    [entities],
    (state, new[Entity]) => [...state, new[Entity]]
  );
  
  // 롤백 로직: 실패 시 optimistic 항목 제거
}
```

### UI Component 연동

**Server Action 연결**:
- Form → Server Action → Result 처리
- 로딩/에러 상태 표시
- 접근성 고려 (aria-label, role 등)

---

## 📋 TDD 구현 순서

> **가이드 참조**: Phase 3.2 - TDD 구현 순서 정의

### Phase별 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. [ValueObject1] VO
   - 테스트 작성 (RED)
   - 최소 구현 (GREEN)
   - 리팩토링 (REFACTOR)
2. [ValueObject2] VO
3. [ValueObject3] VO

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. [Entity1] Entity
2. [Entity2] Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. [Aggregate1]
2. [Aggregate2]

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. [Repository1] (통합 테스트)
2. [Repository2] (통합 테스트)

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. [Service1] (통합 테스트)

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. [action1]Action (통합 테스트)
2. [action2]Action (통합 테스트)

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. [주요 시나리오 1]
2. [주요 시나리오 2]
```

### TDD 사이클 적용 방법

```bash
# 1. RED: 테스트 먼저 작성
$ touch src/domains/[domain]/shared/value-objects/__tests__/[vo-name].test.ts
# 테스트 코드 작성
$ pnpm test [vo-name].test.ts
# 결과: FAIL

# 2. GREEN: 최소 구현
$ touch src/domains/[domain]/shared/value-objects/[vo-name].vo.ts
# 최소 구현 코드 작성
$ pnpm test [vo-name].test.ts
# 결과: PASS

# 3. REFACTOR: 코드 개선
# 검증 로직 추가, 코드 정리
$ pnpm test [vo-name].test.ts
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
- [ ] Software Design의 모든 Aggregate가 수도코드로 작성되었는가?
- [ ] Testing Strategy의 테스트 케이스가 반영되었는가?
- [ ] 모든 컴포넌트에 구현 수도코드가 있는가?
- [ ] 모든 컴포넌트에 테스트 수도코드가 있는가?

### 테스트 수도코드 검증
- [ ] Given-When-Then 패턴이 일관되게 적용되었는가?
- [ ] Happy Path와 Edge Case가 모두 포함되었는가?
- [ ] 불변식 검증이 테스트에 포함되었는가?

### TDD 준비 검증
- [ ] TDD 구현 순서가 명확한가?
- [ ] 커버리지 목표가 명시되었는가?
- [ ] 각 Phase별 우선순위가 표시되었는가?

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - 코드 리뷰 및 PR

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] Testing Strategy와 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Technical Specification을 따라 **TDD 친화적인 [Domain Name]**을 구현할 수 있습니다! 🚀
