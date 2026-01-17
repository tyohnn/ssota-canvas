# Editor Panel Tabs Testing Guide

## 개요

Editor Panel의 동적 탭 시스템이 올바르게 작동하는지 검증하기 위한 테스트 가이드입니다.

## 테스트 환경 준비

1. 개발 서버 실행: `cd apps/web && pnpm dev`
2. 브라우저 DevTools 열기 (Network 탭, Console 탭)
3. YouTube 블록이 있는 페이지로 이동

## 테스트 시나리오

### 1. 탭 전환 테스트

**목적**: 탭 간 전환이 부드럽게 작동하는지 확인

**절차**:
1. YouTube 블록 선택
2. Editor Panel 열기
3. "Script" 탭이 기본으로 선택되어 있는지 확인
4. "Note" 탭 클릭
5. Note 탭 콘텐츠가 표시되는지 확인
6. 다시 "Script" 탭 클릭
7. Script 탭 콘텐츠가 표시되는지 확인

**예상 결과**:
- ✅ 탭 전환이 즉시 이루어짐 (로딩 지연 없음)
- ✅ 각 탭의 콘텐츠가 올바르게 표시됨
- ✅ 선택된 탭이 시각적으로 구분됨 (border-primary, bg-background)

### 2. Config 캐싱 테스트

**목적**: 탭 설정이 올바르게 캐싱되어 재사용되는지 확인

**절차**:
1. YouTube 블록 선택 → Editor Panel 열기
2. Network 탭에서 `editor-tabs-youtube-*.js` 파일이 로드되는지 확인
3. Editor Panel 닫기
4. 같은 YouTube 블록 다시 선택 → Editor Panel 열기
5. Network 탭에서 `editor-tabs-youtube-*.js` 파일이 **다시 로드되지 않는지** 확인

**예상 결과**:
- ✅ 첫 번째 열기: config 파일이 네트워크에서 로드됨
- ✅ 두 번째 열기: config 파일이 캐시에서 사용됨 (네트워크 요청 없음)
- ✅ Console에 에러 없음

### 3. Lazy Loading 테스트

**목적**: 탭 컴포넌트가 필요할 때만 로드되는지 확인

**절차**:
1. YouTube 블록 선택 → Editor Panel 열기
2. Network 탭에서 다음 파일들이 **별도로 로드되는지** 확인:
   - `editor-tabs-script-*.js` (Script Section)
   - `editor-tabs-note-*.js` (Note Section)
3. 초기에는 Script Section만 로드되고, Note 탭 클릭 시 Note Section이 로드되는지 확인

**예상 결과**:
- ✅ Script Section: 기본 탭이므로 즉시 로드됨
- ✅ Note Section: Note 탭 클릭 시에만 로드됨
- ✅ 각 컴포넌트가 별도의 chunk로 분리됨

### 4. Prefetch 동작 테스트

**목적**: Editor Panel이 열릴 때 탭 config가 미리 로드되는지 확인

**절차**:
1. Network 탭 열기
2. YouTube 블록 선택 → Editor Panel 열기
3. Network 탭에서 `editor-tabs-youtube-*.js` 파일이 **prefetch로 로드되는지** 확인 (또는 즉시 로드됨)

**예상 결과**:
- ✅ Editor Panel이 열리면 즉시 또는 prefetch로 config가 로드됨
- ✅ 탭 UI가 표시되기 전에 config가 준비됨

### 5. 탭이 없는 블록 타입 테스트

**목적**: 탭이 없는 블록 타입에서 기존 BlockContentSection이 표시되는지 확인

**절차**:
1. 탭이 없는 블록 타입 선택 (예: TEXT, MARKDOWN)
2. Editor Panel 열기
3. 기존 마크다운 에디터가 표시되는지 확인
4. 탭 UI가 표시되지 않는지 확인

**예상 결과**:
- ✅ 탭이 없는 블록: 기존 BlockContentSection 표시
- ✅ 탭 UI 없음
- ✅ Network에서 탭 관련 파일 로드 없음

### 6. 여러 블록 타입 전환 테스트

**목적**: 다른 블록 타입 간 전환 시 탭이 올바르게 업데이트되는지 확인

**절차**:
1. YouTube 블록 선택 → Editor Panel 열기 → Script 탭 확인
2. Editor Panel 닫기
3. TEXT 블록 선택 → Editor Panel 열기 → 기존 에디터 확인
4. Editor Panel 닫기
5. YouTube 블록 다시 선택 → Editor Panel 열기 → Script 탭이 다시 표시되는지 확인

**예상 결과**:
- ✅ 각 블록 타입에 맞는 탭/에디터 표시
- ✅ 블록 타입 전환 시 올바른 UI 표시
- ✅ 캐시가 올바르게 재사용됨

### 7. 에러 처리 테스트

**목적**: 잘못된 블록 타입이나 로드 실패 시 올바르게 처리되는지 확인

**절차**:
1. `BLOCKS_WITH_TABS`에 없는 블록 타입으로 테스트 (임시로 코드 수정)
2. Editor Panel 열기
3. Console에서 에러 없이 처리되는지 확인

**예상 결과**:
- ✅ 에러가 발생해도 앱이 크래시하지 않음
- ✅ Console에 적절한 경고 메시지 표시 (있는 경우)
- ✅ Fallback으로 기존 BlockContentSection 표시

## 성능 체크리스트

- [ ] 초기 번들 크기: 탭 관련 코드가 메인 번들에 포함되지 않음
- [ ] 첫 로드 시간: YouTube 블록 선택 시 탭이 200ms 이내에 표시됨
- [ ] 탭 전환 시간: 탭 클릭 시 50ms 이내에 콘텐츠 전환됨
- [ ] 메모리 사용: 여러 블록 전환 후에도 메모리 누수 없음

## 브라우저 호환성

다음 브라우저에서 테스트:
- [ ] Chrome (최신)
- [ ] Firefox (최신)
- [ ] Safari (최신)
- [ ] Edge (최신)

## 알려진 이슈

없음 (초기 구현)

## 향후 개선 사항

1. **자동화된 테스트**: Playwright 또는 Vitest를 사용한 E2E 테스트 추가
2. **성능 모니터링**: Web Vitals 메트릭 수집
3. **에러 추적**: Sentry 등으로 에러 모니터링
