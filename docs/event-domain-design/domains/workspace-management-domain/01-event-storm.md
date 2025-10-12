# Workspace Management Domain - Event Storming

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 도메인전문가 + PM  
**작성일**: 2025-10-11  
**버전**: v1.0

**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview
**비즈니스 가치**: 조직 내 작업 공간(Workspace)과 페이지(Page) 구조를 관리하여 팀 단위의 체계적인 협업 환경을 제공. 노션과 유사한 계층적 페이지 구조를 통해 블록 기반 화이트보드 시스템의 기반을 제공하는 핵심 도메인.

## 📝 핵심 개념 정리

### 조직-워크스페이스-페이지 계층 구조
```
Organization (조직)
├── Default Workspace (기본 워크스페이스, 삭제 불가)
│   ├── Page 1 (캔버스)
│   │   ├── SubPage 1-1
│   │   └── SubPage 1-2
│   │       └── SubPage 1-2-1 (무한 중첩 가능)
│   └── Page 2 (캔버스)
├── Marketing Team Workspace (마케팅팀 전용)
│   └── Page 1
├── Dev Team Workspace (개발팀 전용)
│   └── Page 1
└── Planning Team Workspace (기획팀 전용)
    └── Page 1
```

### 도메인 범위 및 경계
- **Workspace**: 조직 내 작업 공간, 여러 페이지의 컨테이너 (팀 단위 분리)
- **Page**: Workspace 내 개별 캔버스 페이지, 무한 계층 구조 가능
- **Membership**: Workspace별 멤버 접근 권한 관리
- **Hierarchy**: 페이지 간 부모-자식 관계 및 순서 관리

### 비즈니스 규칙 및 정책
- **Default Workspace 정책**: 조직 생성 시 기본 워크스페이스 자동 생성, 삭제 불가, 조직 멤버 자동 접근
- **Workspace 생성 정책**: 조직 소유자만 새 Workspace 생성 가능
- **Workspace 접근 정책**: Default Workspace 외 모든 Workspace는 초대 필요
- **멤버 초대 정책**: 조직 Admin은 자신이 속한 Workspace에서만 멤버 초대 가능
- **Page 계층 정책**: 페이지 무한 중첩 가능, 순환 참조 방지 필요
- **삭제 정책**: 소프트 삭제 후 30일 보관, 이후 배치 작업으로 완전 삭제

---

## 🟠 Domain Events (시간 순서)

### Workspace 생성 & 초기화 Events
- Default Workspace가 생성됨 (Default Workspace Created) ← **Organization Domain에서 트리거**
- Workspace 초기 페이지가 생성됨 (Workspace Initial Page Created)
- 조직 생성이 완료됨 (Organization Creation Completed)
- 새 Workspace가 생성됨 (New Workspace Created)
- 조직 소유자가 Workspace 멤버로 추가됨 (Organization Owner Added to Workspace)
- 생성된 페이지로 이동됨 (Navigated to New Page)
- Workspace 이름이 설정됨 (Workspace Name Set)
- Workspace 설명이 설정됨 (Workspace Description Set)
- Workspace 아이콘이 설정됨 (Workspace Icon Set)

### Workspace 접근 & 권한 Events
- 사용자가 조직 경로로 접근함 (User Accessed Organization Path)
- 조직 Workspace-페이지 목록이 로드됨 (Organization Workspace-Page List Loaded)
- 페이지가 선택됨 (Page Selected)
- 최근 방문 페이지가 쿠키에 저장됨 (Recent Page Saved to Cookie)
- 사용자 페이지 접근 권한이 검증됨 (User Page Access Verified)
- 페이지 접근이 거부됨 (Page Access Denied)
- 페이지 상세 정보가 로드됨 (Page Details Loaded)

### Workspace 멤버십 관리 Events
- Workspace 멤버 초대가 생성됨 (Workspace Member Invitation Created)
- 초대 알림이 발송됨 (Invitation Notification Sent)
- Workspace 초대가 수락됨 (Workspace Invitation Accepted)
- 멤버가 Workspace에 추가됨 (Member Added to Workspace)
- Workspace 초대가 거절됨 (Workspace Invitation Rejected)
- 알림이 업데이트됨 (Notification Updated)

### Page 생명주기 Events
- 새 페이지가 생성됨 (New Page Created)
- 빈 캔버스가 초기화됨 (Empty Canvas Initialized)
- 페이지 제목이 설정됨 (Page Title Set)
- 페이지 아이콘이 설정됨 (Page Icon Set)
- 페이지가 복제됨 (Page Duplicated)
- 복제된 페이지가 생성됨 (Duplicated Page Created)

### Page 즐겨찾기 Events
- 페이지가 즐겨찾기에 추가됨 (Page Added to Favorites)
- 페이지가 즐겨찾기에서 제거됨 (Page Removed from Favorites)

### Page 계층 구조 관리 Events
- 페이지가 다른 페이지의 하위로 이동됨 (Page Moved to Child)
- 페이지가 최상위로 이동됨 (Page Moved to Root)
- 페이지 순서가 변경됨 (Page Order Changed)

### Workspace 설정 변경 Events
- Workspace 이름이 변경됨 (Workspace Name Changed)
- Workspace 설명이 변경됨 (Workspace Description Changed)
- Workspace 아이콘이 변경됨 (Workspace Icon Changed)

### Page 삭제 & 복구 Events
- 페이지가 휴지통으로 이동됨 (Page Moved to Trash)
- 하위 페이지들이 함께 휴지통으로 이동됨 (Child Pages Moved to Trash Together)
- 페이지가 휴지통에서 복구됨 (Page Restored from Trash)
- 하위 페이지들이 함께 복구됨 (Child Pages Restored Together)
- 휴지통이 비워짐 (Trash Emptied)
- 페이지가 완전히 삭제됨 (Page Permanently Deleted)
- 배치 삭제 작업이 완료됨 (Batch Deletion Job Completed)

### Workspace 삭제 & 복구 Events
- Workspace가 휴지통으로 이동됨 (Workspace Moved to Trash)
- Workspace 내 모든 페이지가 숨겨짐 (All Pages in Workspace Hidden)
- Workspace가 휴지통에서 복구됨 (Workspace Restored from Trash)
- Workspace 내 모든 페이지가 복원됨 (All Pages in Workspace Restored)
- Workspace가 완전히 삭제됨 (Workspace Permanently Deleted)
- Workspace 관련 데이터가 정리됨 (Workspace Related Data Cleaned Up)
- 배치 삭제 작업이 완료됨 (Batch Deletion Job Completed)

---

## 🔵 Commands & Actors

### 주요 커맨드 목록

#### Scenario 0: Organization 생성 후 Default Workspace 자동 생성 (Organization Domain에서 트리거)
- **시스템이 Default Workspace 생성하기** (System) → Default Workspace가 생성됨
- **시스템이 Welcome 페이지 생성하기** (System) → Workspace 초기 페이지가 생성됨

#### Scenario 1: 사용자가 조직에 접근하여 Workspace-페이지 목록 조회 및 페이지 선택
- **사용자가 조직 경로로 접근하기** (User) → 사용자가 `/r/[orgId]/workspace` 경로로 접근함
- **시스템이 조직 Workspace-Page 목록 로드하기** (Server System) → 조직 Workspace-Page 목록이 로드됨
- **사용자가 페이지 선택하기** (User) → 페이지가 선택됨
- **시스템이 페이지 접근 권한 검증하기** (Server System) → 사용자 페이지 접근 권한이 검증됨 또는 페이지 접근이 거부됨
- **시스템이 페이지 상세 로드하기** (System) → 페이지 상세 정보가 로드됨

#### Scenario 2: 조직 소유자가 새 Workspace 생성 및 수정
- **조직 소유자가 Workspace 생성하기** (Organization Owner) → 새 Workspace가 생성됨
- **시스템이 초기 페이지 생성하기** (System) → Workspace 초기 페이지가 생성됨
- **시스템이 조직 소유자를 Workspace 멤버로 추가하기** (System) → 조직 소유자가 Workspace 멤버로 추가됨
- **시스템이 생성된 페이지로 이동하기** (System) → 생성된 페이지로 이동됨
- **시스템이 최근 방문 페이지 저장하기** (System) → 최근 방문 페이지가 쿠키에 저장됨
- **Workspace 멤버가 Workspace 이름 수정하기** (Workspace Member) → Workspace 이름이 변경됨
- **Workspace 멤버가 Workspace 설명 수정하기** (Workspace Member) → Workspace 설명이 변경됨
- **Workspace 멤버가 Workspace 아이콘 수정하기** (Workspace Member) → Workspace 아이콘이 변경됨

#### Scenario 3: Admin이 Workspace에 멤버 초대
- **Admin이 멤버 초대하기** (Organization Admin) → Workspace 멤버 초대가 생성됨
- **시스템이 초대 알림 발송하기** (Notification System) → 초대 알림이 발송됨
- **초대받은 사용자가 초대 수락하기** (Invited User) → Workspace 초대가 수락됨
- **시스템이 멤버 추가하기** (System) → 멤버가 Workspace에 추가됨
- **초대받은 사용자가 초대 거절하기** (Invited User) → Workspace 초대가 거절됨
- **시스템이 알림 업데이트하기** (Notification System) → 알림이 업데이트됨

#### Scenario 4: 멤버가 Page 생성 및 계층 구조 관리
- **멤버가 새 페이지 생성하기** (Workspace Member) → 새 페이지가 생성됨
- **시스템이 빈 캔버스 초기화하기** (System) → 빈 캔버스가 초기화됨
- **멤버가 페이지를 하위로 이동하기** (Workspace Member) → 페이지가 다른 페이지의 하위로 이동됨
- **멤버가 페이지를 최상위로 이동하기** (Workspace Member) → 페이지가 최상위로 이동됨
- **멤버가 페이지 순서 변경하기** (Workspace Member) → 페이지 순서가 변경됨
- **멤버가 페이지 제목/아이콘 설정하기** (Workspace Member) → 페이지 제목/아이콘이 설정됨

#### Scenario 5: 멤버가 페이지를 즐겨찾기에 추가/제거
- **멤버가 페이지를 즐겨찾기에 추가하기** (Workspace Member) → 페이지가 즐겨찾기에 추가됨
- **멤버가 페이지를 즐겨찾기에서 제거하기** (Workspace Member) → 페이지가 즐겨찾기에서 제거됨

#### Scenario 6: 멤버가 Page 복제 (Post-MVP, Block System 통합 후)
- **멤버가 페이지 복제하기** (Workspace Member) → 페이지가 복제됨
- **시스템이 복제된 페이지 생성하기** (System) → 복제된 페이지가 생성됨
- **시스템이 블록 복제 작업 큐에 추가하기** (Block System) → 블록 복제 작업이 큐에 추가됨

#### Scenario 7: 멤버가 Page 삭제 및 복구
- **멤버가 페이지 삭제하기** (Workspace Member) → 페이지가 휴지통으로 이동됨
- **시스템이 하위 페이지 함께 이동하기** (System) → 하위 페이지들이 함께 휴지통으로 이동됨
- **멤버가 페이지 복구하기** (Workspace Member) → 페이지가 휴지통에서 복구됨
- **멤버가 휴지통 비우기** (Workspace Member) → 휴지통이 비워짐
- **배치 작업이 30일 후 완전 삭제하기** (Batch Job) → 페이지가 완전히 삭제됨

#### Scenario 8: 조직 소유자가 Workspace 삭제 및 복구
- **조직 소유자가 Workspace 삭제하기** (Organization Owner) → Workspace가 휴지통으로 이동됨
- **시스템이 모든 페이지 숨기기** (System) → Workspace 내 모든 페이지가 숨겨짐
- **조직 소유자가 Workspace 복구하기** (Organization Owner) → Workspace가 휴지통에서 복구됨
- **배치 작업이 30일 후 완전 삭제하기** (Batch Job) → Workspace가 완전히 삭제됨

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **조직 소유자 (Organization Owner)**: Workspace 생성, 모든 Workspace 관리
- **조직 Admin (Organization Admin)**: 속한 Workspace에서 멤버 초대/제거
- **조직 Member (Organization Member)**: 초대받은 Workspace 접근, 페이지 생성/편집
- **Workspace Member**: Workspace에 속한 멤버 (페이지 CRUD)
- **초대받은 사용자 (Invited User)**: Workspace 초대 수락/거절

#### System Actors (내부 시스템)
- **Workspace System**: Workspace 생성/삭제, 권한 검증
- **Page System**: 페이지 생성/이동/삭제, 계층 구조 관리
- **Server System**: 서버 사이드 권한 검증 (Next.js Server Actions)
- **Batch Job**: 30일 후 자동 완전 삭제 처리

#### External Systems (외부 도메인)
- **Organization Domain**: 조직 정보, 멤버 목록, 권한 확인
- **Notification Domain**: Workspace 초대 알림 생성/전송
- **Block System Domain** (미래): 페이지 캔버스 내부의 블록 관리

---

## 🟠 Bounded Context 정의

### Context 1: Workspace Management Context 🟦
**책임**: Workspace 생성/관리, 멤버십 관리, 접근 권한 제어

**핵심 언어**: Workspace, Member, Invitation, Access Control, Default Workspace

**핵심 용어 및 개념**:
- **Workspace**: 조직 내 작업 공간 (여러 페이지의 컨테이너)
- **Default Workspace**: 조직 생성 시 자동 생성되는 기본 워크스페이스 (삭제 불가, 조직 멤버 자동 접근)
- **Workspace Owner**: 조직 소유자 (Workspace 생성 권한)
- **Workspace Member**: Workspace에 초대된 조직 멤버
- **Workspace Invitation**: Workspace 멤버 초대 프로세스
- **Access Verification**: 서버 사이드 접근 권한 검증 (Next.js Server Actions/Components)

**포함 이벤트**:
- Workspace 생성 & 초기화 (6개 이벤트)
- Workspace 접근 & 권한 (4개 이벤트)
- Workspace 멤버십 관리 (6개 이벤트)
- Workspace 설정 변경 (3개 이벤트)
- Workspace 삭제 & 복구 (6개 이벤트)

---

### Context 2: Page Structure Context 🟨
**책임**: Page 생명주기, 계층 구조 관리, 휴지통 관리

**핵심 언어**: Page, Hierarchy, Parent-Child, Favorite, Trash, Canvas

**핵심 용어 및 개념**:
- **Page**: Workspace 내 개별 캔버스 페이지
- **Page Hierarchy**: 페이지 계층 구조 (무한 중첩 가능)
- **Parent Page**: 상위 페이지
- **Child Page**: 하위 페이지
- **Page Path**: 페이지 경로 (Breadcrumb 용)
- **Favorite Page**: 즐겨찾기에 추가된 페이지
- **Trash**: 삭제된 페이지 임시 보관소 (30일)
- **Canvas**: 페이지 내부의 블록 기반 화이트보드 (Block System Domain 관리)

**포함 이벤트**:
- Page 생명주기 (6개 이벤트)
- Page 즐겨찾기 (2개 이벤트)
- Page 계층 구조 관리 (4개 이벤트)
- Page 삭제 & 복구 (7개 이벤트)

---

### Context 간 관계 및 통합점

#### Workspace Management ↔ Page Structure
- **연결점**: Workspace 생성 시 초기 페이지 생성, Workspace 삭제 시 모든 페이지 처리
- **데이터 흐름**: 
  - `[Workspace가 생성됨]` → `[초기 페이지가 생성됨]`
  - `[Workspace가 삭제됨]` → `[모든 페이지가 숨겨짐/삭제됨]`
  - `[사용자가 Workspace 접근]` → `[페이지 목록 조회 가능]`
- **통합 방식**: Workspace ID 기반으로 Page 필터링

#### Workspace Management ↔ Organization Domain
- **연결점**: 조직 생성 시 Default Workspace 자동 생성, 권한 검증
- **데이터 흐름**: 
  - `[조직이 생성됨]` → `[Default Workspace 생성 요청]`
  - `[멤버 권한 확인]` ← `[Workspace 초대/접근 시 권한 검증]`
  - `[조직 소유자 확인]` ← `[Workspace 생성 시 권한 검증]`
- **통합 방식**: 조직 권한 API 호출 (Next.js Server Actions)

#### Workspace Management ↔ Notification Domain
- **연결점**: Workspace 멤버 초대 시 알림 생성
- **데이터 흐름**: 
  - `[Workspace 초대 요청]` → `[초대 알림 생성]`
  - `[Workspace 초대 수락]` → `[알림 상태 업데이트]`
- **통합 방식**: 이벤트 기반 알림 생성

#### Page Structure ↔ Block System Domain (미래)
- **연결점**: 페이지 캔버스 내부의 블록 관리
- **데이터 흐름**: 
  - `[페이지가 생성됨]` → `[빈 캔버스 초기화]` (Block System)
  - `[페이지가 삭제됨]` → `[캔버스 블록 정리]` (Block System)
  - `[페이지가 복제됨]` → `[캔버스 블록 복제]` (Block System)
- **통합 방식**: Page ID 기반, 추후 설계

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **Page 계층 구조 무한 중첩 성능 문제**
   - 문제: Page가 무한 중첩 가능하면 깊이가 매우 깊어질 수 있음 (실제 사용자는 보통 5단계 이내)
   - 영향: 
     - 트리 조회 시 재귀 쿼리 성능 저하
     - 페이지 이동 시 하위 페이지 업데이트 필요
     - 하위 페이지 삭제 시 모든 자식 찾기 복잡
   - 해결: 
     - **Parent ID + depth 캐시 패턴**: 부모 ID만 저장하고 depth를 캐시. 이동 시 간단하지만 트리 조회는 재귀 CTE 사용.
     - **PostgreSQL 재귀 CTE**: 트리 조회 성능 충분
     - **현재 판단**: Parent ID + depth 캐시 패턴 채택. 대부분 유저는 5단계 이내 사용 예상.

2. **Workspace 접근 권한 검증 성능**
   - 문제: 모든 요청마다 "사용자가 이 Workspace에 접근 가능한가?" 확인 필요
   - 영향: 
     - 서버 사이드 권한 체크 병목
     - 조직-워크스페이스-멤버십 확인 필요
   - 해결: 
     - **권한 먼저 검증**: 시스템 진입 시 권한 먼저 확인
     - **세션 캐시**: 권한 정보 캐시하여 성능 최적화
     - **Layered Security**: RLS + Application 레벨 이중 체크

3. **Default Workspace 삭제 방지 로직**
   - 문제: 시스템 정책으로 Default Workspace는 삭제 불가하지만, 방어 로직 필요
   - 영향: 
     - 실수로 Default Workspace 삭제 시 조직 전체 문제
     - 복구 프로세스 복잡
   - 해결: 
     - **비즈니스 정책**: Application 레벨에서 Default Workspace 삭제 거부
     - **Entity 불변식**: Workspace Entity에서 deletable 플래그 검증
     - **UI 방어**: 삭제 버튼 비활성화

### 우선순위: 중간

4. **Page 이동 시 순환 참조**
   - 문제: Page A를 Page A의 하위 페이지로 이동하려는 경우
   - 영향: 순환 구조 발생 가능
   - 해결: 
     - **허용**: 비즈니스 정책상 순환 참조 허용
     - **UI 안내**: 드래그 앤 드롭 시 이동 가능 영역 표시

5. **Workspace 삭제 시 데이터 정리 복잡성**
   - 문제: Workspace 삭제 시 연관된 모든 Page, 하위 Page, Block(미래) 정리 필요
   - 영향: 
     - 처리 복잡
     - 삭제 시간 오래 걸림
     - 다른 도메인(Block System)과의 동기화 필요
   - 해결: 
     - **휴지통 이동**: 즉시 처리 (30일 보관)
     - **배치 작업**: 30일 후 완전 삭제 (자동 실행)

6. **Page 복제 시 캔버스 내용 복제 성능**
   - 문제: Page 복제 시 Block System의 수많은 블록 복제 필요 (미래)
   - 영향: 복제 시간 오래 걸림, 사용자 대기
   - 해결: 
     - **비동기 처리**: 복제 진행 중 표시 (로딩 UI)
     - **백그라운드 작업**: 블록 수가 많을 경우 백그라운드에서 처리

### 우선순위: 낮음

7. **최근 방문 페이지 쿠키 관리**
   - 문제: 쿠키에 저장된 페이지 ID가 만료되거나 삭제된 경우
   - 영향: 사용자가 접근 불가능한 페이지로 리다이렉트
   - 해결: 
     - **쿠키 검증 로직**: 서버 사이드에서 쿠키 페이지 ID 유효성 체크
     - **Fallback**: Default Workspace의 첫 번째 페이지로 자동 이동

8. **Workspace 멤버 초대 시 이미 멤버인 경우**
   - 문제: 이미 Workspace 멤버인 사용자를 다시 초대하는 경우
   - 영향: 중복 멤버십, 혼란
   - 해결: 
     - **프론트엔드**: 이미 멤버인 사용자는 선택 불가 (UI 비활성화)
     - **백엔드**: 중복 체크 후 거부 (Server Action에서 검증)

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **Workspace 생성 시 Welcome Page 자동 생성**
   - 기회: 사용자에게 시작점 제공, 빈 Workspace 방지
   - 구현: Workspace 생성 트랜잭션에 "Welcome" 또는 "Untitled" 페이지 자동 생성

2. **Page 즐겨찾기 빠른 접근**
   - 기회: 자주 사용하는 페이지 빠른 접근으로 생산성 향상
   - 구현: 사이드바에 즐겨찾기 섹션, 드래그 앤 드롭으로 추가

3. **Workspace 멤버 초대 간소화**
   - 기회: 조직 멤버를 쉽게 Workspace에 추가
   - 구현: 조직 멤버 목록에서 체크박스로 선택 → 일괄 초대

4. **Page 계층 구조 시각화**
   - 기회: 복잡한 페이지 구조를 한눈에 파악
   - 구현: 트리 구조 사이드바, Breadcrumb 네비게이션, 들여쓰기로 깊이 표현

### 향후 구현 (Post-MVP)

5. **Workspace 템플릿 시스템** *(메모)*
   - "마케팅팀 템플릿", "개발팀 템플릿" 등 미리 정의된 페이지 구조
   - Workspace 생성 시 템플릿 선택 가능
   - 템플릿 마켓플레이스 구축

6. **Page 템플릿 & 갤러리** *(메모)*
   - 페이지 생성 시 템플릿 선택
   - 회의록, 프로젝트 계획, 디자인 브리프 등
   - 커뮤니티 템플릿 공유

7. **Workspace 통계 & 분석** *(메모)*
   - Workspace별 활동 지표 (페이지 수, 활성 멤버, 최근 활동)
   - 가장 많이 보는 페이지 추적
   - 팀 생산성 인사이트

8. **Page 버전 히스토리** *(메모)*
   - 페이지 변경 이력 추적
   - 이전 버전으로 복원
   - 변경 내역 비교 (diff)

9. **Workspace 간 Page 이동** *(메모)*
   - 페이지를 다른 Workspace로 이동
   - 멀티 워크스페이스 관리 지원
   - 권한 확인 및 마이그레이션

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. Workspace 생성 및 권한 제어 (핵심)
- Q: 조직 생성 시 Default Workspace를 어떻게 생성할 것인가? (동기/비동기, 트랜잭션 처리)
- Q: 페이지 접근 권한을 어떤 방식으로 확인할 것인가? (Server Component에서 Workspace 멤버십 확인)
- Q: 조직 소유자가 아닌 사용자가 Workspace 생성을 시도하면 어떻게 처리할 것인가?
- Q: 최근 방문 페이지 쿠키가 유효하지 않을 때 어떤 Fallback 전략을 사용할 것인가? (Default Workspace 첫 페이지)
- Q: 조직 멤버는 모든 Workspace-페이지 목록을 볼 수 있지만, 초대되지 않은 Workspace의 페이지 접근은 어떻게 제한할 것인가?

### 2. Page 계층 구조 관리 (핵심)
- Q: Page 무한 중첩을 어떻게 효율적으로 저장하고 조회할 것인가? (Parent ID + depth 캐시)
- Q: Page 이동 시 순환 참조를 방지할 필요가 있는가? (허용하기로 결정)
- Q: 트리 구조는 어떻게 조회할 것인가? (PostgreSQL 재귀 CTE)
- Q: Page 순서 변경 시 어떤 정렬 알고리즘을 사용할 것인가? (정수 순서)

### 3. Workspace 멤버십 관리
- Q: Workspace 초대 알림은 Notification Domain과 어떻게 통합할 것인가? (Service 주입, 동기 처리)
- Q: 이미 멤버인 사용자를 다시 초대하면 어떻게 처리할 것인가? (UI에서 선택 불가, 중복 방지)
- Q: Workspace에서 멤버 제거 시 해당 멤버가 작업 중인 페이지는 어떻게 되는가? (유지)
- Q: Default Workspace에서 멤버 제거가 가능한가? (조직 멤버이면 자동 접근이므로 불가)

### 4. Page & Workspace 삭제 및 복구
- Q: 페이지 삭제 시 하위 페이지들도 함께 삭제되는가? (Yes, 함께 삭제)
- Q: 휴지통에서 복구 시 원래 위치를 기억하는가? (Yes, 원래 위치 복원. 불가능하면 최상위)
- Q: 30일 후 완전 삭제를 어떻게 트리거할 것인가? (배치 작업)
- Q: Workspace 삭제 시 Block System Domain에 어떻게 알릴 것인가? (미래, 동기 호출)
- Q: 휴지통 비우기는 전체 일괄 삭제인가? (Yes, 전체 삭제)

### 5. 외부 도메인 통합
- Q: Organization Domain에서 멤버 목록을 어떻게 가져올 것인가? (Organization Domain API)
- Q: Page 복제 시 Block System과 어떻게 통신할 것인가? (미래, 비동기 처리)
- Q: Notification Domain에 초대 알림 생성을 어떻게 요청할 것인가? (Service 주입, 동기 처리)

### 6. 성능 및 최적화
- Q: Workspace 페이지 목록 조회 시 페이지네이션이 필요한가? (무한 스크롤? 페이지 번호?)
- Q: Page 계층 구조 전체를 한 번에 로드할 것인가, 필요할 때마다 로드할 것인가? (Lazy Loading)
- Q: 즐겨찾기 페이지 목록은 어떻게 정렬할 것인가? (추가순? 최근 방문순? 사용자 정의?)

---

## 📝 Process Model 준비 상태

Workspace Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션 (Workspace 생성, Page 이동 등)
2. **Policy** 정의: Default Workspace 삭제 불가, 무한 중첩 정책, 권한 제약사항
3. **Read Model** 명시: Workspace 목록 조회, Page 계층 구조 조회, 즐겨찾기 목록
4. **External System**: Organization Domain 권한 API, Notification Domain 이벤트 발행

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025년 10월 11일 (온라인)
**참가자**: 
- **도메인 전문가**: CEO (Workspace & Page 구조 정책)
- **PM**: AI Assistant
- **기획자**: AI Assistant
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (45개 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료
- [x] Bounded Context 경계 정의 완료 (Workspace Management + Page Structure)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### Organization Management Domain과의 관계
- **연결점**: 조직 생성 시 Default Workspace 자동 생성, 권한 검증
- **데이터 흐름**: Organization Management → Workspace Management (Default Workspace 생성 커맨드)
- **통합 방식**: 
  - 이벤트 기반: `[조직이 생성됨]` → `[Default Workspace 생성 요청]`
  - API 호출: Server Action에서 조직 권한 확인

### User Management Domain과의 관계
- **연결점**: 사용자 인증 후 Workspace 접근 권한 확인
- **데이터 흐름**: User Management → Workspace Management (사용자 ID 기반 권한 검증)
- **통합 방식**: Server Component/Action에서 사용자 세션 확인

### Notification Management Domain과의 관계
- **연결점**: Workspace 멤버 초대 시 알림 생성
- **데이터 흐름**: Workspace Management → Notification Management (초대 알림 생성 요청)
- **통합 방식**: 
  - 이벤트 기반: `[Workspace 초대가 요청됨]` → `[알림 생성]`
  - API 호출: Server Action에서 알림 생성 API 호출

### Block System Domain과의 관계 (미래)
- **연결점**: Page 캔버스 내부의 블록 관리
- **데이터 흐름**: Page Structure ↔ Block System (양방향)
- **통합 방식**: 
  - Page 생성 시 빈 캔버스 초기화
  - Page 삭제 시 블록 정리
  - Page 복제 시 블록 복제 (비동기 처리)

---

*이 Event Storming 문서는 Workspace Management Domain의 Process Model 작성을 위한 기반 자료입니다.*

