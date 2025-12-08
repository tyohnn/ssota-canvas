# Story E010-006: 호버 시 회전 제거

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 마우스 호버 시 블록 회전/확대 효과를 제거하여 so that 더 안정적인 UI를 사용할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 호버 효과 제거
```gherkin
Given 사용자가 블록에 마우스를 호버한다
When 호버 효과를 확인한다
Then 블록이 회전하지 않는다
And 블록이 확대되지 않는다 (scale 효과 제거)
And 그림자 효과만 적용된다
```

### 시나리오 2: 모든 블록 타입에 적용
```gherkin
Given 다양한 타입의 블록이 있다
When 각 블록에 마우스를 호버한다
Then 모든 블록에서 hover:scale 효과가 제거되어 있다
```

## 🔧 구현 상세

### 제거할 CSS 클래스
- `hover:scale-[1.02]` - 호버 시 확대 효과
- `hover:rotate-*` - 호버 시 회전 효과 (있는 경우)

### 유지할 CSS 클래스
- `hover:shadow-xl` - 호버 시 그림자 강조
- `transition-all` - 부드러운 전환 효과

### 수정 대상 파일 (모든 블록 타입)
- `block-type/image/index.tsx`
- `block-type/text/index.tsx`
- `block-type/markdown/index.tsx`
- `block-type/shape/index.tsx`
- `block-type/link/index.tsx`
- `block-type/youtube/index.tsx`
- `block-type/audio/index.tsx`
- `block-type/pdf/index.tsx`
- 기타 모든 블록 컴포넌트

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 블록에서 hover:scale 효과 제거
- [ ] 모든 블록에서 hover:rotate 효과 제거
- [ ] 호버 시 그림자 효과는 유지
- [ ] UX 간소화 완료

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 사용자 경험 개선 검증
- [ ] 접근성 기준 충족

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 블록 호버 효과

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

