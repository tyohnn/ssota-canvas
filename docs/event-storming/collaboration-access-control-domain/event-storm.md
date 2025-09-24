# Collaboration & Access Control Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 필수적이지만 차별화 요소는 아닌 표준 협업 및 권한 관리 기능

## 📝 핵심 개념 정리

### 권한 체계
- **Organization**: Owner, Admin, Member, Guest (Clerk 기반)
- **Workspace**: 기본적으로 Organization 권한 상속, 개별 설정 가능
- **Page**: Workspace 권한 상속, 개별 설정 가능

### 공유 방식
- **Organization**: 이메일 초대 (Clerk)
- **Workspace/Page**: 공유링크 + 웹 게시 옵션
- **익명 접근**: 웹 게시를 통한 공개 접근

### 제한사항
- **Free Tier**: 블럭 수 제한, 협업자 3명
- **Pro Tier**: 블럭 무제한, 협업자 무제한

---

## 🟠 Domain Events (시간 순서)

### Workspace Collaboration
- 사용자가 Workspace에 초대되었다 (User Invited to Workspace)
- Workspace 초대가 수락되었다 (Workspace Invitation Accepted)
- Workspace 초대가 거절되었다 (Workspace Invitation Declined)
- 사용자의 Workspace 권한이 변경되었다 (User Workspace Permission Changed)
- 사용자가 Workspace에서 제거되었다 (User Removed from Workspace)
- Workspace 공유 링크가 생성되었다 (Workspace Share Link Created)
- Workspace 공유 설정이 변경되었다 (Workspace Share Settings Updated)
- Workspace가 웹에 게시되었다 (Workspace Published to Web)
- Workspace 웹 게시가 해제되었다 (Workspace Web Publishing Disabled)

### Page Permissions
- Page 권한이 설정되었다 (Page Permission Set)
- Page가 상위 권한을 상속했다 (Page Inherited Parent Permission)
- Page 공유 링크가 생성되었다 (Page Share Link Created)
- Page 공유 설정이 변경되었다 (Page Share Settings Updated)
- Page가 웹에 게시되었다 (Page Published to Web)
- Page 웹 게시가 해제되었다 (Page Web Publishing Disabled)
- Page 접근 권한이 확인되었다 (Page Access Permission Verified)

### Quota & Limitations
- 블럭 할당량이 확인되었다 (Block Quota Checked)
- 블럭 할당량이 초과되었다 (Block Quota Exceeded)
- 협업자 할당량이 확인되었다 (Collaborator Quota Checked)
- 협업자 할당량이 초과되었다 (Collaborator Quota Exceeded)
- 플랜이 업그레이드되었다 (Plan Upgraded)

### Access Monitoring
- 공유 링크가 접근되었다 (Share Link Accessed)
- 웹 게시 페이지가 조회되었다 (Public Page Viewed)
- 권한 없는 접근이 시도되었다 (Unauthorized Access Attempted)
- 접근 로그가 기록되었다 (Access Log Recorded)

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **대량 권한 변경 성능**
   - 문제: Organization에 1000명 있을 때 권한 일괄 변경
   - 영향: UI 응답성 저하
   - 해결: 배치 처리 + 진행률 표시

2. **권한 상속 복잡성**
   - 문제: 상속받은 권한과 개별 설정 권한 충돌
   - 영향: 예상치 못한 접근 권한 변화
   - 해결: 권한 미리보기 + 충돌 해결 UI

### 우선순위: 중간
3. **공유 링크 보안**
   - 문제: 링크 유출 시 보안 위험
   - 영향: 민감한 정보 노출
   - 해결: 만료일 설정 + 접근 로그

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **스마트 권한 제안**
   - 기회: 역할 기반 권한 템플릿 제안
   - 구현: 프로젝트 유형별 권한 프리셋

2. **협업자 온보딩**
   - 기회: 새로운 멤버를 위한 가이드
   - 구현: 인터랙티브 튜토리얼

### 향후 구현 (Post-MVP)
3. **고급 접근 제어**
   - IP 기반 접근 제한
   - 시간 기반 접근 제어

4. **상세 감사 로그**
   - 모든 권한 변경 이력
   - 접근 패턴 분석
