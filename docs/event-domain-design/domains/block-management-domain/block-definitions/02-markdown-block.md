# 마크다운 블록 (Markdown Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `markdown`
- **Enum**: `BlockType.MARKDOWN`
- **데이터베이스**: `block_type_enum.markdown`

### 설명
마크다운 콘텐츠를 작성하고 렌더링할 수 있는 블록입니다. 사용자가 마크다운 문법으로 구조화된 문서를 작성할 수 있으며, 향후 노션처럼 각 마크다운 블록 간 드래그앤드롭이 가능하도록 확장될 수 있습니다.

### 사용 사례
- 구조화된 문서 작성
- 기술 문서 정리
- 프로젝트 노트
- 체크리스트 및 TODO
- 코드 스니펫 포함 문서

## 2. UI 정의

### 기본 UI

**이중 선택 구조** (텍스트/이미지 블록과 유사):
1. **1차 선택**: 블록 선택 상태 (툴바, resizer 표시)
2. **2차 선택**: 더블클릭 또는 재선택 → 편집 모드 진입

**편집 모드 (isEditing = true)**:
- TipTap 에디터 활성화
- 마크다운 실시간 편집
- 포맷팅 버튼 표시 (에디터 내장)

**읽기 모드 (isEditing = false)**:
- TipTap 렌더링 (ProseMirror view)
- 클릭 시 편집 모드 진입

### 기본 크기
```typescript
{
  width: 400,   // 픽셀
  height: 300   // 픽셀 (콘텐츠에 따라 자동 조정)
}
```

### 블록 스페이스/에디터 통합

**특별 구조**: 에디터 UI에 통합된 마크다운 섹션 (향후 구현)
- Properties Section (상단): 색상 등 스타일 속성
- **Markdown Section (하단)**: 블록과 동일한 TipTap 렌더링
- 동일한 `block.content` 공유 (실시간 동기화)
- 노션 페이지와 유사한 경험

**현재 구현**: 블록 내부에서만 편집 가능 (이중 선택 구조)

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "마크다운" 선택
2. 캔버스에 마크다운 블록 생성
3. **1차 선택**: 블록 선택 (툴바 표시)
4. **2차 선택** (더블클릭): 편집 모드 진입
5. TipTap 에디터에서 내용 입력
6. ESC 또는 외부 클릭 시 편집 종료

### 편집 모드 진입/종료
- **진입**: 선택 상태에서 더블클릭 또는 재선택
- **종료**: 
  - ESC 키
  - 외부 영역 클릭 (blur)
  - Cmd/Ctrl+Enter (저장 후 종료)

### 붙여넣기 방식
- **.md 파일**: 파일 내용을 파싱하여 TipTap JSON으로 변환
- **일반 텍스트**: 마크다운 블록으로 생성하고 텍스트 삽입

## 4. 데이터 구조

### Block Content (DB 컬럼)

마크다운 블록은 다른 블록과 달리 **`block.content`** JSONB 컬럼을 활용합니다:

```typescript
// DB: blocks.content (JSONB)
{
  type: 'doc',
  content: [
    // TipTap JSON 구조
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello world' }]
    }
  ]
}
```

**특징:**
- `properties`가 아닌 `block.content` JSONB 컬럼에 저장
- TipTap Editor의 JSON 형식 그대로 저장
- 블록 자체와 에디터가 동일한 content를 공유

### Properties Interface

```typescript
export interface MarkdownBlockProperties {
  // 스타일
  color: ColorToken;                  // 배경 색상
}
```

### 기본 속성

#### 1. color
- **타입**: `ColorToken`
- **설명**: 블록 배경 색상
- **기본값**: `ColorToken.WHITE`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '배경 색상',
    inputType: 'color',
    icon: 'Palette',
    description: '블록의 배경 색상',
    order: 1,
  }
  ```

### 메타데이터 속성 (공통)
- `createdAt`: 생성일 (readonly-datetime)
- `updatedAt`: 수정일 (readonly-datetime)
- `createdBy`: 작성자 프로필 (readonly-profile)

### 속성 그룹 (UI Schema Groups)

```typescript
groups: [
  {
    id: 'style',
    label: '스타일',
    description: '블록 스타일 설정',
    defaultCollapsed: true,
    order: 1,
    properties: ['color'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

블록 선택 시 표시되는 툴바 (BaseBlock 제공):

### 1. ColorToolbarItem
- **아이콘**: 현재 배경색 미리보기
- **기능**: 배경 색상 변경
- **동작**: Popover로 색상 팔레트 표시
- **업데이트**: `properties.color`

### 2. DownloadMarkdownToolbarItem
- **아이콘**: `Download`
- **기능**: 마크다운 다운로드
- **동작**: .md 파일로 다운로드

### TipTap 에디터 내부 툴바 (별도)

TipTap 에디터 내부의 플로팅 메뉴 버튼 (블록 내부에서 텍스트 선택 시 표시):
- **헤딩**: H1, H2, H3 버튼
- **리스트**: Bullet, Numbered 버튼
- **포맷**: Bold, Italic, Code 버튼
- **삽입**: Link, Image, Table 버튼
- **블록**: Quote, Code Block, Divider 버튼

이는 TipTap 에디터가 제공하는 내장 기능으로, 우리가 정의하는 툴바와는 별개입니다.

## 6. 블록 툴

### 1. 내용 요약하기 (Summarize)
- **입력**: 
  - 현재 마크다운 블록
  - 요약 길이 파라미터 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (구조화된 요약)
- **설명**: AI를 사용하여 마크다운 내용을 요약

### 2. 목차 생성 (Generate TOC)
- **입력**: 현재 마크다운 블록
- **출력**: 새로운 마크다운 블록 (목차)
- **설명**: 헤딩 구조를 분석하여 목차 생성

## 7. 구현 참조

### Database Schema
```
apps/web/src/db/schema.ts
```
**block.content JSONB 컬럼 추가**:
```typescript
content: jsonb('content').default({}) // TipTap JSON
```

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/markdown.vo.ts
```

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/markdown/markdown-block.tsx
```

**사용 라이브러리**:
- **에디터**: `@tiptap/react` (TipTap)
- **기본 확장 기능** (간단한 구현): 
  - `@tiptap/starter-kit` (Document, Paragraph, Text, Heading, Bold, Italic 등 기본 기능)
  - 향후 필요에 따라 추가 확장 기능 설치

### Canvas Integration
```
apps/web/src/domains/canvas-management/frontend/components/core/canvas-react-flow-wrapper.tsx
```
**nodeTypes 등록**:
```typescript
const nodeTypes = {
  text: TextBlock,
  markdown: MarkdownBlock, // 추가됨
  // ...
};
```

### Content Update Hook
```
apps/web/src/domains/block-management/frontend/hooks/use-block-content-update.ts
```

마크다운은 `properties`가 아닌 `block.content`를 업데이트:
```typescript
const { updateContent } = useBlockContentUpdate();
await updateContent(blockId, tipTapJSON, nodeData);
```

**데이터 흐름**:
```
Component → Hook (Optimistic Update) → Server Action → Service → Aggregate → Entity → Repository → DB
```

## 8. 특이사항 및 주의사항

### Content vs Properties
- **Content**: `block.content` JSONB (TipTap JSON)
- **Properties**: `block.metadata.properties` (색상 등 스타일)
- 마크다운 콘텐츠는 properties가 **아님**

### 이중 선택 구조
- 텍스트/이미지 블록과 동일한 UX
- `isEditing` 상태로 편집 모드 관리
- 선택 해제 시 자동 저장 (debounce 500ms)

### TipTap 초기 구현
- **Starter Kit 사용**: 가장 간단한 구현
- 기본 기능만 포함 (Heading, Paragraph, Bold, Italic, List 등)
- 향후 확장 가능 (코드 블록, 테이블, 이미지 등)

### 에디터 UI 통합
- Properties Section: 기존 에디터 UI 구조
- **Markdown Section**: 새로운 섹션 추가
- 블록과 에디터가 동일한 `block.content` 공유

### 저장 전략
- 편집 중 debounce (500ms)
- Blur 시 즉시 저장
- Cmd/Ctrl+Enter: 저장 후 종료
- ESC: 저장하지 않고 종료 (최근 저장 버전으로 복원)

### 성능 최적화 (향후)
- 큰 문서: 가상 스크롤링
- 코드 하이라이팅: Shiki 활용 (이미 설치됨)
- 협업 기능: Yjs (향후)

## 9. 구현 완료 사항

### ✅ 완료된 구현

#### Domain Layer
- [x] BlockType enum에 MARKDOWN 추가
- [x] MarkdownBlockPropertiesVO 구현
- [x] Factory에 등록 (createDefault, fromJSON)

#### Data Flow Layer
- [x] UpdateBlockContentCommand 추가
- [x] BlockPropertyService.updateContent() 메서드
- [x] BlockAggregate.updateContent() 메서드
- [x] Block.update() content 파라미터 추가
- [x] updateBlockContentAction Server Action
- [x] useBlockContentUpdate Hook

#### Schema & UI Layer
- [x] UI Schema 정의 (markdown-block.ui-schema.ts)
- [x] UI Schema Registry 등록
- [x] BlockToolbarMapper에 markdown case 추가
- [x] ColorToolbarItem 적용

#### Component Layer
- [x] MarkdownBlock 컴포넌트 (TipTap + 이중 선택)
- [x] BaseBlock 활용
- [x] Optimistic Update + Debounce 자동 저장

#### Canvas Integration
- [x] nodeTypes에 등록
- [x] Shadow Preview 구현
- [x] Shadow Preview Registry 등록
- [x] Add Dialog 옵션 추가

#### Database
- [x] blocks.content JSONB 컬럼 추가
- [x] Migration 생성 (0043_chemical_tombstone.sql)

## 10. 향후 계획

- [ ] **에디터 UI 통합**: Properties Panel에 Markdown Section 추가
- [ ] **TipTap 확장 기능**: Code Block, Table, Image 등
- [ ] **노션 스타일 블록 분리**: 헤딩/리스트를 개별 블록으로 드래그앤드롭
- [ ] **템플릿 지원**: 마크다운 템플릿 라이브러리
- [ ] **내보내기**: PDF, HTML, DOCX 등으로 내보내기
- [ ] **가져오기**: Notion, Obsidian, Roam Research 등에서 가져오기
- [ ] **AI 기능**: 자동 완성, 문법 교정, 톤 조정
- [ ] **협업 기능**: 실시간 공동 편집, 코멘트

