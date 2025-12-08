# Story E010-001: 이미지 블록 수정

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 간소화된 이미지 블록을 사용하여 so that 불필요한 복잡성 없이 이미지를 표시할 수 있다

**Story Points**: 5pts  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 이미지 블록 간소화
```gherkin
Given 사용자가 이미지 블록을 사용한다
When 이미지 블록 옵션을 확인한다
Then cover 고정, 종횡비 맞춤 등 핵심 기능만 제공된다
And 불필요한 옵션이 제거된다
```

### 시나리오 2: 이미지 블록 기본 동작
```gherkin
Given 이미지 블록이 간소화되었다
When 사용자가 이미지를 업로드한다
Then 이미지가 cover 모드로 표시된다
And 종횡비가 자동으로 맞춰진다
```

### 시나리오 3: 종횡비 유지 리사이즈
```gherkin
Given 이미지 블록이 선택되었다
When 사용자가 리사이즈 핸들을 드래그한다
Then 이미지의 종횡비가 유지된다
And 블록 크기가 비례적으로 조정된다
```

## 🔧 구현 상세

### 간소화 항목 (8개)
1. **블록 액션 주석 처리** - `image-block-actions.ts` 비활성화
2. **objectFit 고정** - 항상 `cover`로 설정, 상단 툴바/에디터 패널에서 옵션 제거 / properties에서 제거
3. **종횡비 맞춤 블록 생성** - 이미지 업로드 시 원본 종횡비로 블록 크기 자동 설정
4. **종횡비 고정 리사이저** - 이미지 블록 전용 비례 리사이즈 옵션 추가
5. **alt 버튼 주석** - 상단 툴바에서 alt 입력 버튼 비활성화 / properties에서 제거
6. **이미지 확대 버튼 주석** - expand-image-toolbar-item 비활성화
7. **블록 앱스페이스 버튼 주석** - 앱스페이스 관련 버튼 비활성화
8. **캡션 보이기 주석** - caption-visibility-toolbar-item 비활성화

### 수정 대상 파일
- `block-type/image/index.tsx` - 메인 컴포넌트
- `block-type/image/toolbar-items/index.tsx` - 툴바 아이템 주석
- `block-type/image/action-items/image-block-actions.ts` - 액션 주석
- `block-type/image/config/image-editor-panel-schema.ts` - objectFit 속성 제거
- `block-type/image/core/use-image-block.business.ts` - 종횡비 맞춤 로직
- `block-type/base-block/components/resize-control.tsx` - 종횡비 고정 리사이저

## 🎯 Definition of Done

### 기능 완료
- [ ] 이미지 블록 간소화 완료 (8개 항목)
- [ ] objectFit이 항상 cover로 동작
- [ ] 이미지 업로드 시 종횡비 맞춤 블록 크기 설정
- [ ] 종횡비 고정 리사이저 동작
- [ ] 불필요한 툴바/액션 버튼 비활성화

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 사용자 경험 개선 검증
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - E005-001: 기본 블록 정의 및 아키텍처 설계
- **도메인 의존성**: 
  - Block Management Domain: 이미지 블록 타입

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - 블록 컴포넌트

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)

