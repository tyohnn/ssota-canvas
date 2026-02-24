# Link App 개발 계획 (Phase A–D)

> SSOTA Link App 링크 블록 구현을 위한 단계별 개발 계획.  
> 상세 기획은 [SSOTA-Link-App.md](./SSOTA-Link-App.md) 참조.  
> UI/탭/액션 패턴은 YouTube 블록(`block-type/youtube`) 참고.

---

## Phase A – 현재 상태에서 링크 블록 활용 확인

**목표**: 지금 구현된 링크 블록이 어떻게 쓰이는지 확인.

- **이미 가능한 것**
  - 링크 블록 추가 → URL 입력 → OG 카드 표시
  - 툴바(Open Link, URL, Copy) 및 액션 바 노출
- **확인할 것**
  - 블록 선택 시 에디터 패널: 속성 그룹(basic-info, metadata)만 노출되는지
  - 액션 버튼(요약 등)은 보이지만 실행은 미구현(TODO)인지 확인

**산출물**: Phase A 완료 후 “링크 블록 사용 흐름”이 정리된 상태.

---

## Phase B – 에디터 탭(섹션 탭) 추가

**목표**: 링크 블록 에디터를 YouTube처럼 탭 기반으로 구성.

1. **탭 설정 추가**
   - `link/config/link-editor-tabs.ts` 생성
   - 탭: 요약(default), 추출, 스크린샷, 이미지, 디자인, JSON, (선택) Note
   - `componentPath`: `link/components/section-tabs/<section-id>` 형식
2. **레지스트리 연동**
   - `block-editor-tabs-registry.ts`의 `BLOCKS_WITH_TABS`에 `link: true` 추가
   - `tabs-prefetch.ts`에 `link` 경로 매핑 추가
3. **섹션 탭 컴포넌트**
   - `link/components/section-tabs/` 하위에 다음 섹션 생성
     - `summary-section`, `extract-section`, `screenshot-section`, `images-section`, `design-section`, `json-section`
   - 각 섹션: index + 뷰 컴포넌트
   - 초기에는 “데이터 없음. 해당 도구를 실행하세요” 빈 상태 + (선택) 해당 탭과 연결된 액션 버튼

**산출물**: 링크 블록 선택 시 요약/추출/스크린샷/이미지/디자인/JSON 탭이 보이고, 빈 상태 UI가 동작하는 상태.

---

## Phase C – Action Items 확장 및 실행 구현

**목표**: Block Tool 5종을 UI 액션과 실행 경로까지 연결.

1. **액션 스키마**
   - `LinkBlockActionSchemas`: 기획서 §5에 맞게 `summarize`, `screenshot`, `extractImages`, `extractDesign`, `extractJSON` inputSchema 정의
2. **액션 컴포넌트**
   - `LinkActionItems`에 5종 액션 컴포넌트 추가 (YouTube의 ExtractSummaryAction, VisualSummaryAction 패턴 참고)
3. **실행 로직**
   - `link-block-actions.ts`의 `executeAction`: 각 액션별 서버/에이전트와 동일 API 호출
   - 우선 `summarize` 구현, 나머지는 스텁 후 순차 구현
4. **탭 데이터 저장**
   - 기획서 §4·§5에 따라 `properties.tabs` (summary, extract, screenshot, images, design, json) 사용
   - `LinkBlockProperties`/`link.vo.ts`에 `tabs` 필드 없으면 스키마·타입 확장

**산출물**: 요약/스크린샷/이미지/디자인/JSON 도구를 UI에서 실행 가능하고, 결과가 해당 탭 및 `properties.tabs`에 반영되는 상태.

---

## Phase D – (선택) 자동 인덱싱

**목표**: 링크 블록 생성 시 추출·요약을 자동 실행.

- **실행 흐름**
  - 링크 블록 생성 → Source 도메인(또는 링크 전용 플로우)에서 자동 인덱싱 트리거
  - firecrawl 등으로 마크다운 추출 → `properties.tabs.extract.markdown`
  - 추출 결과로 요약 생성 → `properties.tabs.summary.ko` 등
- **실행 주체**
  - Source 도메인 서비스 또는 링크 블록 전용 서비스
  - Block Tool의 `summarize`/추출과 동일 로직 재사용, 실행 시점만 “블록 생성 시”로 다름

**산출물**: URL만 넣고 링크 블록을 만들면, 생성 직후 요약·추출 탭에 데이터가 채워지는 상태.

---

## 참고

- **기획·스키마**: [SSOTA-Link-App.md](./SSOTA-Link-App.md)
- **아키텍처 원칙**: [Architecture.md](./Architecture.md)
- **UI 참조**: `apps/web/src/domains/block-management/frontend/components/block/block-type/youtube/components/` (toolbar-items, section-tabs, action-items)
