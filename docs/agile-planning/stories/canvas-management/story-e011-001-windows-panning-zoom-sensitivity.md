# Story E011-001: 윈도우 패닝/줌 감도 조정

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 윈도우에서 패닝/줌 감도가 정상적으로 동작하여 so that 캔버스를 자연스럽게 조작할 수 있다

**Story Points**: 1pt  
**우선순위**: Low (P3)  
**Epic**: Epic-011 Bug Fixes & Stabilization  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 패닝 감도 조정
```gherkin
Given 사용자가 윈도우에서 캔버스를 사용하고 있다
When 패닝을 수행한다
Then 패닝 감도가 정상적으로 동작한다
And 마우스 움직임에 비례하여 캔버스가 이동한다
```

### 시나리오 2: 줌 감도 조정
```gherkin
Given 사용자가 윈도우에서 캔버스를 사용하고 있다
When 줌을 수행한다
Then 줌 감도가 정상적으로 동작한다
And 휠 스크롤에 비례하여 줌이 적용된다
```

## 🎯 Definition of Done

### 기능 완료
- [x] 윈도우 패닝 감도 조정 완료
- [x] 윈도우 줌 감도 조정 완료
- [x] 정상 동작 검증 완료

### 기술 완료
- [x] 플랫폼별 감도 설정 구현 (Windows: 0.18, Mac: 0.1)
- [x] 커스텀 wheel 이벤트 핸들러 구현
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 크로스 플랫폼 호환성 검증
- [x] 사용자 경험 개선 검증

## 📊 진행 상황
**현재**: ✅ 100% 완료  
**완료일**: 2025-01-XX

## 📝 구현 내역

### 주요 변경 사항
- ✅ **Deprecated API 마이그레이션**: `navigator.platform` → `navigator.userAgentData` (또는 `navigator.userAgent` fallback)
- ✅ **플랫폼별 감도 설정**: Windows (0.18), Mac (0.1)
- ✅ **커스텀 wheel 이벤트 핸들러**: Ctrl/Cmd + Wheel로 줌 제어

### 구현 파일
**파일**: `apps/web/src/domains/canvas-management/frontend/components/react-flow-wrapper/core/use-react-flow-wrapper.ui.ts`

### 플랫폼 감지
```typescript
const isWindows = React.useMemo(() => {
  if (typeof window === 'undefined') return false;

  // 최신 방법: navigator.userAgentData 사용 (Chrome/Edge)
  if ('userAgentData' in navigator) {
    const uaData = navigator.userAgentData as { platform?: string };
    return uaData.platform?.toLowerCase().includes('win') ?? false;
  }

  // Fallback: navigator.userAgent 사용
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('win') || userAgent.includes('windows');
}, []);
```

### 플랫폼별 줌 감도 설정
```typescript
const zoomMultiplier = React.useMemo(() => {
  return isWindows ? 0.18 : 0.1;
}, [isWindows]);
```

### 커스텀 wheel 이벤트 핸들러
- Ctrl/Cmd + Wheel로 줌 제어
- 플랫폼별 감도 적용
- 즉시 viewport 업데이트 (duration: 0)

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 패닝/줌 기능

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-011: Bug Fixes & Stabilization](../../epics/epic-011-bug-fixes-stabilization.md)

