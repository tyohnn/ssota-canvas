# Layered Architecture Check: Drive 기능 개발 계획 (문서 평가)

> `docs/plans/drive-feature-plan.md`를 `server-side-ddd-architecture-check` 및 `docs/patterns/backend/server-side-ddd-conventions.md` 기준으로 평가한 결과입니다.  
> 대상은 **구현 코드가 아닌 계획 문서**이므로, “계획이 DDD 레이어·데이터 흐름을 반영하고 있는지”와 “구현 시 준수할 지침이 명시되어 있는지”를 검토했습니다.

## Summary

- **Status**: ⚠️ Partial (부분 준수)
- **Scope**: `docs/plans/drive-feature-plan.md` 전편
- **결론**: 도메인 경계·기존 컴포넌트 활용·라우팅·UI는 잘 정리되어 있으나, **백엔드 데이터 흐름(Trust Boundary → SafeDTO → Command → Event → Repository)** 과 **Server Action / Secure Action** 에 대한 언급이 없어, 그대로 구현 시 DDD 컨벤션과 어긋날 여지가 있습니다.

---

## By Layer

### Server Action (Trust Boundary)

- **상태**: ❌ 계획에 미반영
- **내용**:  
  - Drive 관련 “블록 목록 조회”, “블록 생성(추가 다이얼로그)”, “검색” 등 **Server Action** 존재 여부·역할이 명시되어 있지 않음.  
  - `unknown` 수신, Zod `safeParse`, `INVALID_REQUEST` 반환, SafeDTO만 내부로 전달 등 **Trust Boundary** 요구사항이 문서에 없음.  
  - `withPageSecureAction` / `withWorkspaceSecureAction` 등 **Secure Action** 사용 여부도 불명확.

### Internal Function

- **상태**: ❌ 계획에 미반영
- **내용**:  
  - 인증·권한 확인 후 SafeDTO에 `userId` 등을 붙여 Service로 넘기는 **Internal Function** 계층이 계획에 등장하지 않음.  
  - “Drive 전용 서비스”만 언급되어 있어, 호출 경로가 Action → Internal → Service 인지 문서만으로는 판단 불가.

### Service Layer

- **상태**: ⚠️ 일부만 언급
- **내용**:  
  - §5.2 백엔드에서 **“Drive 전용 서비스”**와 **Block Repository** 확장(`listByWorkspaceIds` 등)이 언급됨.  
  - 그러나 **Service Function** 패턴, **SafeDTO → Command 변환**, **Repository를 파라미터로 주입** 등 컨벤션이 계획에 반영되어 있지 않음.  
  - “블록 생성” 시 기존 block-management 서비스 재사용 여부와, 재사용 시에도 SafeDTO → Command → Aggregate 흐름을 유지할지가 명시되지 않음.

### Aggregate Layer

- **상태**: ❌ 계획에 미반영
- **내용**:  
  - 블록 생성·수정 시 **Aggregate**, **Command**, **Domain Event** 에 대한 설계가 없음.  
  - 기존 `BlockMountAggregate` / `BlockAggregate` 재사용 여부, Drive 전용 Command/Event 필요 여부가 문서에 없음.

### Repository Layer

- **상태**: ✅ 부분 반영
- **내용**:  
  - §5.2에서 **Block Repository**의 org 단위 목록을 위한 확장(`listByWorkspaceIds` 또는 org → workspace IDs 후 조회)이 제안됨.  
  - **Aggregate/Entity를 받아 DB row로 매핑**하는 역할, **인터페이스 + 주입** 원칙은 계획에 명시되어 있지 않음.

---

## Violations

| Severity | Layer | Issue | Location |
|----------|-------|-------|----------|
| 🔴 Critical | Server Action | Trust Boundary(unknown, Zod, SafeDTO) 및 Secure Action 사용 여부가 계획에 없음 | 전반, §5·§6 |
| 🔴 Critical | Data flow | unknown → SafeDTO → Command → Event → DB 흐름이 문서에 없음 | §5 데이터·API, §6 구현 단계 |
| 🟡 Suggestion | Service | “Drive 전용 서비스”만 있고, Service Function·SafeDTO→Command·Repository 주입이 명시되지 않음 | §5.2, §6 Phase 2·3 |
| 🟡 Suggestion | Aggregate | 블록 생성/수정 시 Command·Event·Aggregate 설계 누락 | §6 Phase 3·4 |
| 🟡 Suggestion | Repository | Repository 역할을 “목록 조회 확장” 위주로만 서술, Aggregate/Entity 입출력은 미명시 | §5.2 |

---

## Recommendations

1. **§5 데이터·API 또는 §6 구현 단계에 “백엔드 데이터 흐름” 단락 추가**  
   - 클라이언트 → **Server Action (`unknown`)** → Zod 검증 → **Internal (인증·권한, SafeDTO)** → **Service (SafeDTO → Command)** → **Aggregate (Command → Event)** → **Repository (Aggregate/Entity → DB)** 요약.  
   - Drive 신규 Action은 **withPageSecureAction / withWorkspaceSecureAction** 등 Secure Action 사용 권장을 명시.

2. **Drive 관련 Server Action·Internal·Service 목록을 계획에 명시**  
   - 예: 블록 목록 조회(Drive 스코프), 블록 생성(추가 다이얼로그), 검색 등.  
   - 각각 “Action(Trust Boundary) → Internal → Service” 경로를 갖도록 하고, 기존 block-management와의 경계(재사용 vs Drive 전용)를 한 줄씩이라도 적어 두면 구현 시 DDD 일관성을 유지하기 쉬움.

3. **블록 생성(Phase 3) 설계 보강**  
   - 기존 `createBlockAction` / BlockMount 서비스 재사용 시: 호출 경로가 SafeDTO만 넘기고, Command 생성은 Service에서만 하도록 계획에 명시.  
   - Drive 전용 “블록만 생성(마운트 없음)” 등 새 유스케이스가 있으면, 해당 Command/Event/Aggregate(또는 기존 Aggregate 확장)를 §5 또는 §6에 짧게 정의.

4. **Repository 확장 시 컨벤션 명시**  
   - `listByWorkspaceIds` 등은 **Repository 인터페이스**에 추가하고, **Service는 해당 Repository를 파라미터로 받는 Service Function**으로 구현한다는 원칙을 §5.2에 한 문단으로 추가.

5. **참조 문서 링크 추가**  
   - §7 참조에 `docs/patterns/backend/server-side-ddd-conventions.md` 및 (사용 시) `reference/secure-action-definition.md`, `reference/actions-folder-structure.md`를 추가해, 구현 시 DDD·Secure Action 규칙을 같이 보도록 유도.

---

이 평가를 반영해 계획서를 보완하면, 구현 단계에서 server-side-ddd-architecture-check 기준을 만족하기 쉬워집니다.
