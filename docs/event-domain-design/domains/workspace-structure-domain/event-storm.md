# Workspace Structure Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 체계적인 작업 공간 관리와 협업 기반 제공 - 모든 다른 도메인의 컨텍스트 기반

## 📝 핵심 개념 정리

### Clerk Integration Strategy
- **Organization**: Clerk에서 관리, 우리 DB에 동기화
- **User**: Clerk에서 관리, 우리 DB에 기본 정보 저장
- **Sync Method**: Webhook을 통한 실시간 동기화

### 계층 구조
```
Organization (Clerk)
└── Workspace (Multiple)
    └── Page (Unlimited nesting, folder = page)
```

### 계층 관리 범위
- **Organization**: Clerk에서 관리하는 최상위 컨테이너
- **Workspace**: Organization 내 독립적인 작업 공간
- **Page**: Workspace 내 무제한 중첩 가능한 페이지 (폴더 = 페이지)


### 삭제 정책
- **Page**: Soft delete → 휴지통 → 30일 후 완전 삭제
- **Workspace**: Danger zone 관리 → Soft delete → 30일 후 완전 삭제


---

## 🟠 Domain Events (시간 순서)

### Organization & User Management (Clerk Sync)
- Clerk Organization이 생성되었다 (Clerk Organization Created)
- Clerk Organization 정보가 동기화되었다 (Organization Synced from Clerk)
- 사용자가 Organization에 초대되었다 (User Invited to Organization)
- 사용자가 Organization 초대를 수락했다 (Organization Invitation Accepted)
- 사용자가 Organization에서 제거되었다 (User Removed from Organization)
- 사용자의 Organization 역할이 변경되었다 (User Organization Role Changed)
- Clerk Organization이 삭제되었다 (Clerk Organization Deleted)
- Organization 삭제 경고가 표시되었다 (Organization Deletion Warning Shown)

### Workspace Lifecycle
- Workspace가 생성되었다 (Workspace Created)
- 빈 Workspace가 생성되었다 (Empty Workspace Created)
- Workspace 이름이 변경되었다 (Workspace Name Changed)
- Workspace 설명이 설정되었다 (Workspace Description Set)
- Workspace 아이콘이 설정되었다 (Workspace Icon Set)
- Workspace가 즐겨찾기에 추가되었다 (Workspace Bookmarked)
- Workspace가 즐겨찾기에서 제거되었다 (Workspace Unbookmarked)


### Page Structure Management
- Page가 생성되었다 (Page Created)
- 빈 Page가 생성되었다 (Empty Page Created)
- Page 제목이 변경되었다 (Page Title Changed)
- Page 아이콘이 설정되었다 (Page Icon Set)
- Page가 즐겨찾기에 추가되었다 (Page Bookmarked)
- Page 부모가 변경되었다 (Page Parent Changed)
- Page가 다른 Workspace로 이동되었다 (Page Moved to Different Workspace)
- Page 순서가 변경되었다 (Page Order Changed)
- Page가 복제되었다 (Page Duplicated)


### Deletion & Recovery
- Page가 휴지통으로 이동되었다 (Page Moved to Trash)
- Page가 휴지통에서 복구되었다 (Page Restored from Trash)
- Page가 완전히 삭제되었다 (Page Permanently Deleted)
- Workspace가 완전히 삭제되었다 (Workspace Permanently Deleted)
- 휴지통이 비워졌다 (Trash Emptied)



---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **Clerk Webhook 신뢰성**
   - 문제: Webhook 실패 시 데이터 불일치
   - 영향: Organization/User 동기화 오류
   - 해결: Retry 메커니즘 + 주기적 동기화 백업

2. **Page 이동 시 권한 검증**
   - 문제: 다른 Workspace로 이동 시 권한 확인 복잡
   - 영향: 무단 Page 이동 가능성
   - 해결: 양쪽 Workspace 권한 검증

### 우선순위: 중간
3. **무제한 Page 중첩 성능**
   - 문제: 깊은 중첩 시 로딩 성능
   - 영향: 사용자 경험 저하
   - 해결: Lazy loading + 가상화

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **Workspace 탐색 개선**
   - 기회: 빠른 검색 + 최근 항목
   - 구현: 실시간 검색 + 액세스 히스토리

2. **Page 계층 시각화**
   - 기회: 복잡한 중첩 구조 이해 개선
   - 구현: 트리뷰 + 브레드크럼

### 향후 구현 (Post-MVP)
3. **AI 기반 구조 제안** *(메모)*
   - 프로젝트 목적에 맞는 Page 구조 제안
   - 사용 패턴 분석 기반 정리 제안

4. **고급 탐색 기능** *(메모)*
   - 전역 검색 (블럭 내용 포함)
   - 태그 기반 분류

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. Clerk Webhook 처리
- Q: Webhook 실패 시 재시도 전략은?
- Q: 동기화 지연 시 사용자에게 어떻게 알릴까?
- Q: Organization 삭제 후 복구 불가능한 상황 처리?

### 2. Page 이동과 권한 관리 (핵심)
- Q: Page 이동 시 권한 확인 방법은?
- Q: 이동 권한이 없는 Workspace로 이동 시도 시 처리?
- Q: 하위 Page들의 권한은 어떻게 처리?

### 3. Page 중첩 및 성능
- Q: 몇 단계까지 중첩을 허용할 것인가?
- Q: 깊은 중첩 시 성능 최적화 전략은?
- Q: 중첩 구조의 시각화 방법은?

---

## 📝 Process Model 준비 상태

Workspace Structure Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션
2. **Policy** 정의: Clerk 동기화 규칙, Page 이동 제약사항
3. **Read Model** 명시: 구조 탐색, 검색에 필요한 정보
4. **External System**: Clerk API 호출, Webhook 처리

Process Modeling으로 진행하시겠습니까?
