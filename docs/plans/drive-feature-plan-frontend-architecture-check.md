# Frontend Architecture Check: Drive 기능 개발 계획 (docs/plans/drive-feature-plan.md)

## Summary

- **Status**: ⚠️ Partial
- **Scope**: 계획서 문서 평가 (구현 코드 없음 — `domains/drive/` 미생성)
- **기준**: [docs/patterns/frontend/component-development-guidelines.md](../patterns/frontend/component-development-guidelines.md) 및 프로젝트 Container/Presentational·훅 레이어·TanStack Query 패턴

계획서는 도메인 배치·기존 컴포넌트 활용 방향은 명확하나, **Container/Presentational 분리**, **도메인 훅·TanStack Query 사용**, **훅 레이어(UI·비즈니스·오케스트레이션)** 를 명시하지 않아 구현 시 가이드라인 이탈 위험이 있습니다.

---

## Container/Presentational

- **Status**: ⚠️ 부분 반영

**긍정**
- Drive 페이지·그리드·헤더·다이얼로그·블록 상세를 기능 단위로 나누어 기술함.
- "복제 후 수정" 대상으로 WorkspaceSettingsDialog, WorkspacePageHeader, EditorPanel 등 **이미 Container/Presentational 구조를 가진 컴포넌트**를 지정함 (MembersTab → `useMembersTab` + Presentational).

**부족**
- 새로 만드는 **Drive 그리드**, **Drive 헤더**, **Drive 추가 다이얼로그**, **타입 필터 바**, **검색창**에 대해 다음이 계획에 없음:
  - 각 화면/컴포넌트별 **Container (index.tsx)** 와 **Presentational (components/)** 분리 원칙.
  - View는 **props만** 받고, `useQuery`/`useMutation`/서버 액션을 사용하지 않는다는 명시.
- "Drive 전용 미리보기 셀"이 단순 뷰인지, 클릭/네비게이션 등 로직을 어디에 둘지(Container vs View) 정의되지 않음.

---

## Hook Layers

- **Status**: ❌ 미반영

**긍정**
- `domains/drive/` 하위에 **frontend/components, hooks** 구조를 두기로 함 (§2.1, Phase 1).
- "Drive 전용 훅/서비스" 언급 (§2.1, §3.2 "블록 목록 데이터 — Drive용 블록 목록 훅/서비스").

**부족**
- **도메인 훅** (`domains/drive/frontend/hooks/`):
  - 블록 목록 조회(org·타입·폴더·검색), 블록 생성, (선택) 검색 API 연동 등 **서버 액션 1:1 도메인 훅** 목록이 없음.
  - 각 훅을 **TanStack Query** (`useQuery`/`useMutation`)로 래핑한다는 기술이 없음.
- **컴포넌트 국소 훅**:
  - Drive 그리드, Drive 추가 다이얼로그, 필터 바 등에 대해 **use-*.ui.ts**(폼/필터 상태만), **use-*.business.ts**(도메인 훅 조합), **use-*.ts**(오케스트레이션) 분리가 계획에 없음.
- WorkspaceSettingsDialog 복제 시 **use-workspace-settings-dialog.ts / .ui.ts**, MembersTab의 **use-members-tab / .ui / .business** 같은 레이어를 Drive 추가 다이얼로그에서도 유지할지 명시되지 않음.

---

## TanStack Query

- **Status**: ⚠️ 암묵적만 존재

**긍정**
- "블록 목록 데이터 — Drive용 블록 목록 훅/서비스", "제출 시 블록 생성 후 그리드 갱신" 등으로 **서버 상태·캐시 무효화** 필요성이 드러남.
- 기존 가이드라인대로라면 이는 도메인 훅 + TanStack Query 담당 구간과 맞음.

**부족**
- 블록 목록 조회를 **useQuery** (queryKey: orgId, folderId, typeFilter, search)로 할지 명시 없음.
- 블록 생성 시 **useMutation** + `onSuccess`에서 목록 쿼리 invalidate 또는 optimistic update 여부가 없음.
- 검색창 연동이 "키워드 검색 API"만 언급되고, 해당 호출을 **도메인 훅 + useQuery/useMutation**으로 둘지 미정.

---

## Folder Structure

- **Status**: ✅ 대체로 적절

**긍정**
- `domains/drive/` + `frontend/components`, `hooks` (필요 시 `backend/services`) 제안 (§2.1, Phase 1).
- 기존 도메인(block-management, workspace-management 등)과 동일한 상위 구조.

**보완 제안**
- 각 **컴포넌트** 내부는 가이드라인에 맞춰:
  - `index.tsx` (Container),
  - `components/` (Presentational),
  - `core/` (use-*.ts, use-*.ui.ts, use-*.business.ts, types.ts)
- 이를 계획서 Phase 2·3·4에 "Drive 그리드/헤더/추가 다이얼로그/블록 상세는 위 폴더 구조 적용" 한 줄로 명시하면 구현 일관성이 좋아짐.

---

## Violations (계획서 기준)

| Severity | Area | Issue | Location |
|----------|------|-------|----------|
| 🔴 Critical | Hook Layers | 서버 연동(목록/생성/검색)을 담당할 **도메인 훅** 목록·역할이 없음 | §2.1, §5, §6 Phase 2–4 |
| 🔴 Critical | TanStack Query | 블록 목록/생성/검색을 **useQuery·useMutation**으로 둔다는 기술 없음 | §5, §6 |
| 🟡 Suggestion | Container/Presentational | 새 Drive 화면·다이얼로그에 Container(index) + Presentational(components) 분리 원칙 미기재 | §4, §6 |
| 🟡 Suggestion | Hook Layers | 컴포넌트별 **use-*.ui / use-*.business / use-*.ts** 분리 원칙 미기재 | §3.2, §6 Phase 2–3 |
| 🟡 Suggestion | Folder Structure | 컴포넌트 내부 **core/** 및 훅 파일 네이밍 규칙 미기재 | §6 Phase 1 |

---

## Recommendations

1. **도메인 훅 명시 (§2.1 또는 §5·§6)**  
   - `domains/drive/frontend/hooks/` 에서 제공할 훅을 나열:
     - 예: `use-drive-block-list.ts` (useQuery, orgId·folderId·typeFilter·search),
     - `use-drive-create-block.ts` (useMutation, 생성 후 목록 invalidate 또는 optimistic),
     - (검색 API 사용 시) `use-drive-search.ts` 등.
   - "서버 액션은 도메인 훅으로만 호출하며, Presentational·UI 훅에서는 직접 호출하지 않는다"는 원칙을 한 줄로 추가.

2. **TanStack Query 사용 명시**  
   - 블록 목록: **useQuery** (queryKey: drive, orgId, folderId?, typeFilter?, search?).
   - 블록 생성: **useMutation** + `onSuccess` 시 해당 queryClient.invalidateQueries 또는 optimistic update.
   - 계획서 §5.1·§6 Phase 2·3에 위 내용을 짧게 추가.

3. **Container/Presentational 및 훅 레이어**  
   - §4 또는 §6에 다음을 추가:
     - "Drive 그리드, Drive 추가 다이얼로그, Drive 헤더, 타입 필터 등 새 UI는 Container/Presentational 패턴 적용: Container(index.tsx)는 단일 오케스트레이션 훅 사용, View(components/)는 props만 받음."
     - "복제하는 WorkspaceSettingsDialog·MembersTab과 동일하게, 컴포넌트별 use-*.ui.ts(로컬 UI 상태), use-*.business.ts(도메인 훅 조합), use-*.ts(오케스트레이션) 분리 유지."

4. **폴더 구조**  
   - Phase 1 또는 §2.1에 "각 Drive 전용 컴포넌트는 index.tsx + components/ + core/(use-*.ts, use-*.ui.ts, use-*.business.ts)" 한 문장 추가.

5. **참조 문서**  
   - 계획서 §7에 `docs/patterns/frontend/component-development-guidelines.md` 링크를 추가해 구현 시 훅·Container/View·TanStack Query 기준을 바로 참조하도록 함.

---

## 정리

계획서는 **도메인 배치·라우팅·기존 컴포넌트 활용** 측면에서는 가이드라인과 잘 맞고, **폴더 구조**도 도메인 단위로 적절합니다. 다만 **도메인 훅·TanStack Query·훅 레이어·Container/Presentational**을 계획 단계에서 명시하지 않아, 구현 시 View에서 직접 서버 액션 호출·단일 거대 훅 등 안티패턴이 생길 수 있습니다. 위 권장 사항을 반영하면 구현 단계에서 가이드라인 준수 가능성이 높아집니다.
