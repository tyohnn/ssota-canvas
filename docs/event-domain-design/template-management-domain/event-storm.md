# Template Management Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 재사용 가능한 템플릿을 통한 빠른 시작 및 생산성 향상

## 📝 핵심 개념 정리

### 템플릿 유형
- **Workspace Template**: 전체 워크스페이스 구조와 초기 페이지들
- **Page Template**: 개별 페이지 구조와 블럭 레이아웃

### 템플릿 적용
- **Workspace 생성 시**: 템플릿 선택 → 구조 복사
- **빈 Workspace**: 템플릿 없이 생성
- **Page 생성 시**: 템플릿 선택 가능

---

## 🟠 Domain Events (시간 순서)

### Template Creation & Management
- Workspace 템플릿이 등록되었다 (Workspace Template Registered)
- Page 템플릿이 등록되었다 (Page Template Registered)
- 템플릿이 갱신되었다 (Template Updated)
- 템플릿 사용량이 기록되었다 (Template Usage Tracked)
- 템플릿이 비활성화되었다 (Template Deactivated)
- 템플릿이 삭제되었다 (Template Deleted)

### Template Usage
- Workspace가 템플릿으로 생성되었다 (Workspace Created from Template)
- Page가 템플릿으로 생성되었다 (Page Created from Template)
- 템플릿 적용이 실패했다 (Template Application Failed)
- 템플릿 데이터가 변환되었다 (Template Data Transformed)

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **템플릿 데이터 일관성**
   - 문제: 원본 변경 시 기존 템플릿 유효성
   - 영향: 템플릿 적용 실패
   - 해결: 버전 관리 + 마이그레이션

---

## 💡 Opportunities (개선 기회)

### 향후 구현 (Post-MVP)
1. **동적 템플릿**
   - 변수 치환 시스템
   - 조건부 블럭 포함

2. **커뮤니티 템플릿**
   - 템플릿 마켓플레이스
   - 평점 및 리뷰 시스템
