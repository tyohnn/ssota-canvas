# Story 명명 규칙 가이드

## 🎯 목적

Story ID를 통해 **어떤 Epic에 속하는지** 명확하게 식별할 수 있도록 명명 규칙을 정의합니다.

---

## 📋 현재 문제점

### 기존 명명 패턴
- `BM-001`, `BM-002` (Block Management Domain)
- `CM-001`, `CM-002` (Canvas Management Domain)
- `AI-001`, `AI-002` (AI Management Domain)
- `BLK-001`, `BLK-002` (Block - Epic-005)

### 문제점
- Story ID만 봐서는 **어떤 Epic에 속하는지 알 수 없음**
- 같은 도메인 내에서 여러 Epic의 Story가 섞일 수 있음
- Epic별로 Story를 그룹화하기 어려움

---

## 📋 명명 규칙 제안

### 옵션 1: Epic 번호만 사용 (추천) ⭐

**형식**: `E[EPIC번호]-[순번]`

**예시**:
- `E005-001`: Epic-005의 첫 번째 Story (기본 블록 정의)
- `E005-002`: Epic-005의 두 번째 Story (마크다운 마이그레이션)
- `E007-001`: Epic-007의 첫 번째 Story (데이터베이스 생성)
- `E008-001`: Epic-008의 첫 번째 Story (AI 리서치)

**장점**:
- ✅ 가장 간결하고 명확함
- ✅ Epic 번호만으로 즉시 식별 가능
- ✅ Epic별로 Story 그룹화 용이
- ✅ 도메인 정보는 Epic 문서에서 확인 가능
- ✅ 혼란을 줄임 (도메인 약어 불필요)

**단점**:
- ⚠️ 기존 Story와 호환성 문제 (점진적 마이그레이션 필요)

---

### 옵션 2: EPIC 접두사 사용

**형식**: `EPIC-[EPIC번호]-[순번]`

**예시**:
- `EPIC-005-001`: Epic-005의 첫 번째 Story
- `EPIC-005-002`: Epic-005의 두 번째 Story
- `EPIC-007-001`: Epic-007의 첫 번째 Story

**장점**:
- ✅ "EPIC" 키워드로 더 명확함
- ✅ 검색 시 쉽게 찾을 수 있음

**단점**:
- ⚠️ ID가 약간 길어짐

---

## 🎯 추천 방안: 옵션 1 (Epic 번호만 사용)

### 명명 규칙

```
E[EPIC번호]-[순번]
```

### 파일명 규칙

```
story-e[epic번호]-[순번]-[기능명].md
```

**예시**:
- `story-e005-001-basic-block-definition.md`
- `story-e005-002-markdown-block-migration.md`
- `story-e007-001-database-creation.md`

### 폴더 구조

Story는 Epic의 주 도메인 폴더에 저장하되, Epic 번호로도 식별 가능:

```
stories/
  ├── block-management/
  │   ├── story-e005-001-basic-block-definition.md
  │   ├── story-e005-002-markdown-block-migration.md
  │   └── story-bm-001-block-creation.md (기존)
  ├── database/
  │   └── story-e007-001-database-creation.md
  └── ai-management/
      └── story-e008-001-ai-research-tool.md
```

---

## 📋 마이그레이션 계획

### 기존 Story 처리

**옵션 A: 점진적 마이그레이션** (추천)
- 새로운 Story부터 새 규칙 적용
- 기존 Story는 유지 (참조만 업데이트)

**옵션 B: 전체 마이그레이션**
- 모든 Story ID 변경
- 관련 문서 링크 업데이트
- Git 히스토리 유지

### 마이그레이션 예시

**기존**:
```
BLK-001 → E005-001
BLK-002 → E005-002
BM-001 → E003-001 (Epic-003에 속한다면)
```

**관련 문서 업데이트**:
- Epic 문서의 Story 목록
- Initiative 문서의 Story 참조
- Sprint 문서의 Story 할당
- Story 문서 내 의존성 참조

---

## 📋 사용 예시

### Epic-005: Basic Block & View System

| Story ID | 제목 | Story Points |
|----------|------|--------------|
| `E005-001` | 기본 블록 정의 및 아키텍처 설계 | 13pts |
| `E005-002` | 마크다운 블록 마이그레이션 | 8pts |
| `E005-003` | 보기 방식 시스템 구현 | 8pts |
| `E005-004` | 마크다운 보기 구현 | 5pts |
| `E005-005` | 카드 보기 구현 | 5pts |

### Epic-007: Database Feature

| Story ID | 제목 | Story Points |
|----------|------|--------------|
| `E007-001` | 데이터베이스 생성/설정 | 8pts |
| `E007-002` | 블록 → 데이터베이스 편입 | 8pts |
| `E007-003` | 테이블 뷰 렌더링 | 5pts |

---

## 📋 Story 문서 내 표기

### Story 헤더
```markdown
# Story E005-001: 기본 블록 정의 및 아키텍처 설계

## 🎯 Story 개요
**Story ID**: E005-001
**Epic**: Epic-005 Basic Block & View System
**Domain**: Block Management Domain
```

### Epic 문서 내 표기
```markdown
## 📊 Story 목록

- **E005-001**: 기본 블록 정의 및 아키텍처 설계 (13pts)
- **E005-002**: 마크다운 블록 마이그레이션 (8pts)
```

---

## 📋 체크리스트

Story 작성 시 확인:
- [ ] Story ID가 `E[번호]-[순번]` 형식을 따르는가?
- [ ] Epic 번호가 올바른가?
- [ ] 파일명이 `story-e[번호]-[순번]-[기능명].md` 형식을 따르는가?
- [ ] Epic 문서에 Story ID가 명시되어 있는가?
- [ ] Story 문서에 Epic 링크가 포함되어 있는가?

---

## 📚 관련 문서

- [Story 정의 가이드](./04-story-definition-guide.md)
- [Epic 계획 가이드](./03-epic-planning-guide.md)

---

이 가이드를 따라 Story ID를 명확하고 일관되게 관리할 수 있습니다! 🏷️
