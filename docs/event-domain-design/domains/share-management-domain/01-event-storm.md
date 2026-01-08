# Share Management Domain - Event Storming

## 🎯 개요

**도메인**: Share Management  
**작성자**: 도메인전문가 + PM  
**작성일**: 2026-01-01
**버전**: v1.0

**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview
**비즈니스 가치**: 사용자가 작성한 페이지를 게시하여 외부에 공유하고, 다른 사용자가 이를 접근하여 복제할 수 있는 기능을 제공. 초기에는 게시 기능(Public Publish)을 중심으로 구현하며, 향후 협업 기반 공유 기능(협업자 공유, 권한 기반 공유 등)으로 확장 예정.

**다른 도메인과의 관계**:
- **Workspace Management Domain**: 페이지 복제 시 대상 워크스페이스 조회 및 페이지 복제 처리
- **User Management Domain**: 회원 여부 확인, 인증 처리
- **Workspace Management Domain (Page Structure Context)**: 게시할 페이지 정보 조회

---

## 📝 핵심 개념 정리

### 페이지 게시 및 공유 구조
```
페이지 소유자 (Page Owner)
├── 페이지 게시 (Publish Page)
│   ├── 게시 링크 생성 (Publish Link Generated)
│   └── 공개 상태로 전환 (Page Published)
│
공개된 페이지 접근자 (Viewer)
├── 비회원 (Non-member)
│   ├── 게시 링크 접속 (Access Publish Link)
│   ├── 링크 복제 (Copy Link)
│   ├── 페이지 복제 시도 (Attempt Copy Page)
│   └── 로그인 요구 (Login Required)
│
└── 회원 (Member)
    ├── 게시 링크 접속 (Access Publish Link)
    ├── 페이지 복제 (Copy Page)
    ├── 워크스페이스 선택 (Select Workspace)
    └── 복제 완료 (Copy Completed)
```

### 도메인 범위 및 경계
- **게시된 페이지 (Published Page)**: 공개 상태로 게시된 페이지, 링크를 통해 접근 가능
- **게시 링크 (Publish Link)**: 게시된 페이지에 접근할 수 있는 고유 링크
- **페이지 복제 (Page Copy)**: 게시된 페이지를 자신의 워크스페이스로 복제하는 기능
- **게시 상태 관리**: 페이지 게시 상태 관리 (MVP: 게시만, 비게시는 향후 구현)
- **접근 제어**: 게시된 페이지는 읽기 전용 (수정 불가, 원본 페이지는 소유자만 수정 가능)

### 비즈니스 규칙 및 정책
- **게시 정책**: 페이지 소유자만 게시 가능 (MVP: 게시만, 비게시는 향후 구현)
- **읽기 전용 정책**: 게시된 페이지는 모든 사용자(회원/비회원)가 읽기만 가능, 수정 불가
- **복제 정책**: 회원만 페이지 복제 가능, 비회원은 로그인 후 복제 가능
- **워크스페이스 선택 정책**: 복제 시 자신이 속한 워크스페이스 중 선택
- **링크 복제 정책**: 게시 링크는 누구나 복제 가능 (회원/비회원 무관)

---

## 🟠 Domain Events (시간 순서)

### 페이지 게시 Events
- 페이지가 게시됨 (Page Published)
- 게시 링크가 생성됨 (Publish Link Generated)
- 페이지가 비게시됨 (Page Unpublished) - 향후 구현 (MVP 제외)
- 게시 링크가 만료됨 (Publish Link Expired) - 향후 구현

### 게시 링크 접근 Events
- 게시 링크에 접속됨 (Publish Link Accessed)
- 링크가 복제됨 (Link Copied)

### 페이지 복제 Events
- 페이지 복제가 시도됨 (Page Copy Attempted)
- 회원 여부가 확인됨 (Membership Status Checked)
- 로그인이 요구됨 (Login Required) - 비회원의 경우
- 워크스페이스 목록이 로드됨 (Workspace List Loaded)
- 워크스페이스가 선택됨 (Workspace Selected)
- 페이지가 복제됨 (Page Copied)
- 페이지 복제가 실패됨 (Page Copy Failed) - 향후 구현

---

## 🔵 Commands & Actors

### 주요 커맨드 목록

#### Scenario 1: 페이지 소유자가 페이지 게시
- **페이지 소유자가 페이지 게시하기** (Page Owner) → 페이지가 게시됨
- **시스템이 게시 링크 생성하기** (System) → 게시 링크가 생성됨

#### Scenario 2: 비회원이 게시 링크 접속 및 복제 시도
- **비회원이 게시 링크 접속하기** (Non-member) → 게시 링크에 접속됨
- **비회원이 링크 복제하기** (Non-member) → 링크가 복제됨
- **비회원이 페이지 복제 시도하기** (Non-member) → 페이지 복제가 시도됨
- **시스템이 회원 여부 확인하기** (System) → 회원 여부가 확인됨
- **시스템이 로그인 요구하기** (System) → 로그인이 요구됨

#### Scenario 3: 회원이 게시 링크 접속 및 페이지 복제
- **회원이 게시 링크 접속하기** (Member) → 게시 링크에 접속됨
- **회원이 페이지 복제 시도하기** (Member) → 페이지 복제가 시도됨
- **시스템이 회원 여부 확인하기** (System) → 회원 여부가 확인됨
- **시스템이 워크스페이스 목록 로드하기** (System) → 워크스페이스 목록이 로드됨
- **회원이 워크스페이스 선택하기** (Member) → 워크스페이스가 선택됨
- **시스템이 페이지 복제하기** (System) → 페이지가 복제됨

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **페이지 소유자 (Page Owner)**: 페이지를 게시하는 사용자
- **비회원 (Non-member)**: 게시된 페이지를 조회하고 복제를 시도하는 비로그인 사용자
- **회원 (Member)**: 게시된 페이지를 조회하고 복제하는 로그인 사용자

#### System Actors (내부 시스템)
- **Share System**: 페이지 게시 상태 관리, 게시 링크 생성 및 관리
- **Auth System**: 회원 여부 확인, 로그인 처리
- **Workspace System**: 워크스페이스 목록 조회 (Workspace Management Domain)
- **Page System**: 페이지 복제 처리 (Workspace Management Domain)

#### External Systems (외부 도메인)
- **Workspace Management Domain**: 페이지 복제 처리, 워크스페이스 목록 조회
- **User Management Domain**: 회원 여부 확인, 인증 처리
- **Workspace Management Domain (Page Structure Context)**: 게시할 페이지 정보 조회

---

## 🟠 Bounded Context 정의

### Context 1: Page Publishing Context 🟪 (Main Context)
**책임**: 페이지 게시 상태 관리, 게시 링크 생성 및 관리

**핵심 언어**: Publish, Publish Link, Published Page, Public Access

**핵심 용어 및 개념**:
- **Publish**: 페이지를 공개 상태로 전환하는 행위
- **Publish Link**: 게시된 페이지에 접근할 수 있는 고유 링크
- **Published Page**: 공개 상태로 게시된 페이지
- **Public Access**: 누구나 접근 가능한 공개 접근
- **Publish Status**: 게시 상태 (Published, Unpublished)
- **Link Token**: 게시 링크에 포함되는 고유 토큰

**포함 이벤트**:
- 페이지 게시 Events (4개 이벤트)
- 게시 링크 접근 Events (2개 이벤트)

---

### Context 2: Page Copy Context 🟦 (Supporting Context)
**책임**: 게시된 페이지 복제 처리, 복제 워크플로우 관리

**핵심 언어**: Copy, Copy Page, Workspace Selection, Copy Workflow

**핵심 용어 및 개념**:
- **Copy Page**: 게시된 페이지를 자신의 워크스페이스로 복제하는 행위
- **Workspace Selection**: 복제 대상 워크스페이스 선택
- **Copy Workflow**: 페이지 복제 워크플로우 (회원 확인 → 워크스페이스 선택 → 복제 실행)
- **Copy Target**: 복제 대상 (워크스페이스)

**포함 이벤트**:
- 페이지 복제 Events (9개 이벤트)

---

## 🔗 Context 간 관계 및 통합점

### Page Publishing Context ↔ Page Copy Context
- **연결점**: 게시된 페이지 복제 요청 처리
- **데이터 흐름**: 
  - `[게시 링크에 접속됨]` → `[페이지 복제 시도됨]`
  - `[페이지가 게시됨]` → `[페이지 복제 가능 상태로 전환됨]`
- **통합 방식**: 동기적 서비스 호출

---

### Share Management Domain ↔ Workspace Management Domain
- **연결점**: 페이지 복제 처리, 워크스페이스 목록 조회
- **데이터 흐름**: 
  - `[페이지 복제 시도됨]` → `[Workspace Management Domain: 워크스페이스 목록 조회]`
  - `[워크스페이스가 선택됨]` → `[Workspace Management Domain: 페이지 복제 실행]`
  - `[Workspace Management Domain: 페이지가 복제됨]` → `[페이지가 복제됨]`
- **통합 방식**: 동기적 서비스 주입 (Next.js Server Actions)

---

### Share Management Domain ↔ User Management Domain
- **연결점**: 회원 여부 확인, 인증 처리
- **데이터 흐름**: 
  - `[페이지 복제 시도됨]` → `[User Management Domain: 회원 여부 확인]`
  - `[회원 여부가 확인됨]` (비회원) → `[User Management Domain: 로그인 처리]`
- **통합 방식**: 동기적 API 호출 (Next.js Server Actions)

---

### Share Management Domain ↔ Workspace Management Domain (Page Structure Context)
- **연결점**: 게시할 페이지 정보 조회
- **데이터 흐름**: 
  - `[페이지 게시하기]` → `[Workspace Management Domain: 페이지 정보 조회]`
  - `[게시 링크에 접속됨]` → `[Workspace Management Domain: 페이지 정보 조회]`
- **통합 방식**: 동기적 서비스 주입

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **비회원의 복제 워크플로우 처리**
   - 문제: 비회원이 복제 시도 시 로그인 후 복제 워크플로우를 재개하는 방법
   - 영향: 사용자 경험 저하, 복제 완료율 감소 가능
   - 해결: 로그인 후 이전 복제 의도 상태 유지 (세션/쿠키 저장), 복제 워크플로우 재개

2. **게시 링크 보안 및 접근 제어**
   - 문제: 게시 링크의 보안성 및 무단 접근 방지
   - 영향: 보안 취약점, 원치 않는 접근 가능
   - 해결: 토큰 기반 게시 링크, 링크 만료 정책 (향후 구현)

### 우선순위: 중간

3. **대용량 페이지 복제 성능**
   - 문제: 블록이 많은 페이지 복제 시 성능 문제
   - 영향: 사용자 대기 시간 증가, 서버 부하
   - 해결: 비동기 복제 처리 (향후 구현), 복제 진행 상태 표시

4. **게시된 페이지 수정 시 동기화**
   - 문제: 원본 페이지 수정 시 게시된 페이지 버전 관리
   - 영향: 사용자 혼란, 데이터 일관성 문제
   - 해결: 스냅샷 방식 채택 (게시 시점 버전 고정, MVP 적용)
   - 참고: 원본 페이지는 소유자만 수정 가능, 게시된 페이지는 읽기 전용

### 우선순위: 낮음

5. **게시 링크 통계 및 분석**
   - 문제: 게시 링크 접근 통계, 조회수 추적
   - 영향: 기능 우선순위 낮음, 향후 분석 기능 확장에 필요
   - 해결: 향후 구현 (Post-MVP)

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **게시 링크 생성 및 관리**
   - 기회: 페이지 게시 시 고유한 게시 링크 생성 및 관리
   - 구현: 토큰 기반 링크 생성, 링크와 페이지 매핑 저장

2. **비회원/회원 복제 워크플로우**
   - 기회: 회원 여부에 따른 복제 워크플로우 분기 처리
   - 구현: 회원 여부 확인 → 비회원: 로그인 요구, 회원: 워크스페이스 선택 → 복제 실행

### 향후 구현 (Post-MVP)

3. **협업 기반 공유 기능** *(메모)*
   - 협업자 초대 기능 (특정 사용자에게만 공유)
   - 권한 기반 공유 (읽기/댓글/편집 권한 구분)
   - 공유 링크 만료 설정
   - 공유 링크 비밀번호 설정

4. **게시 링크 관리 기능** *(메모)*
   - 게시 링크 목록 조회
   - 게시 링크 비활성화
   - 게시 링크 접근 통계
   - 게시 링크 만료 설정

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. 페이지 게시 프로세스 처리
- Q: 페이지 게시 시 어떤 정보가 필요한가? (페이지 ID, 소유자 정보 등)
- Q: 게시 링크는 어떤 형식으로 생성되는가? (토큰 기반? UUID 기반?)
- Q: 게시된 페이지의 접근 권한은 어떻게 관리되는가? (모든 사용자 접근 가능? 제한 가능?)
- Q: 게시된 페이지를 비게시할 수 있는가? 비게시 시 기존 링크는 어떻게 되는가?

### 2. 페이지 복제 워크플로우 (핵심)
- Q: 비회원이 복제 시도 시 로그인 후 복제 워크플로우를 어떻게 재개하는가?
- Q: 워크스페이스 목록은 어떻게 조회되는가? (사용자가 속한 모든 워크스페이스? 특정 조직의 워크스페이스만?)
- Q: 페이지 복제 시 원본 페이지의 어떤 정보가 복제되는가? (제목, 내용, 블록 구조 등)
- Q: 복제된 페이지의 제목은 어떻게 정해지는가? (원본 제목 유지? "Copy of [제목]" 형식?)
- Q: 복제 실패 시 사용자에게 어떤 피드백을 제공하는가?

### 3. 게시 링크 접근 제어 및 보안
- Q: 게시 링크의 보안은 어떻게 보장되는가? (토큰 검증 방식)
- Q: 게시된 페이지 수정 시도 시 어떻게 처리되는가? (읽기 전용 강제)
- Q: 게시 링크 접근 시 로그인 여부와 관계없이 접근 가능한가?

### 4. 외부 도메인 통합
- Q: Workspace Management Domain과의 통합 방식은? (서비스 주입? API 호출?)
- Q: User Management Domain과의 통합 방식은? (인증 확인 API?)
- Q: Workspace Management Domain (Page Structure Context)에서 게시할 페이지 정보를 어떻게 조회하는가?

---

## 📝 Process Model 준비 상태

Share Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션 (이미 완료)
2. **Policy** 정의: 게시 정책, 복제 정책, 접근 제어 정책
3. **Read Model** 명시: 게시 링크 접근 시 제공되는 페이지 정보, 복제 시 워크스페이스 목록
4. **External System**: Workspace Management Domain (페이지 복제), User Management Domain (인증)

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025-01-27  
**참가자**: 
- **도메인 전문가**: [이름]
- **PM**: [이름]
- **기획자**: [이름] 
- **시니어 개발자**: [이름]

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성
- [x] 커맨드 및 액터 식별 완료
- [x] Bounded Context 경계 정의 완료
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### Workspace Management Domain와의 관계
- **연결점**: 페이지 복제 처리, 워크스페이스 목록 조회
- **이벤트 흐름**: Share Management → Workspace Management (페이지 복제 요청)
- **통합 방식**: 동기적 서비스 주입 (Next.js Server Actions)

### User Management Domain와의 관계
- **연결점**: 회원 여부 확인, 인증 처리
- **이벤트 흐름**: Share Management → User Management (회원 여부 확인, 로그인 처리)
- **통합 방식**: 동기적 API 호출 (Next.js Server Actions)

### Workspace Management Domain (Page Structure Context)와의 관계
- **연결점**: 게시할 페이지 정보 조회
- **이벤트 흐름**: Share Management → Workspace Management (페이지 정보 조회)
- **통합 방식**: 동기적 서비스 주입

---

*이 Event Storming 문서는 Share Management Domain의 Process Model 작성을 위한 기반 자료입니다.*
