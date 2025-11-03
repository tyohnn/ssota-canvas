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
- 마크다운 에디터 (편집 모드)
- 마크다운 렌더러 (읽기 모드)
- 편집/읽기 모드 토글
- 툴바 (포맷팅 버튼)

### 기본 크기
```typescript
{
  width: 300,   // 픽셀
  height: 200   // 픽셀 (콘텐츠에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**있음** - 블록형 마크다운 에디터 제공
- TipTap 기반 에디터 사용
- 노션 스타일 블록 편집
- 실시간 렌더링
- 슬래시(/) 명령어 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "마크다운" 선택
2. 캔버스에 마크다운 블록 생성
3. 자동으로 편집 모드 진입
4. 내용 입력 후 완성

### 붙여넣기 방식
- **.md 파일**: 파일 내용을 마크다운 블록으로 생성
- **일반 텍스트**: 모든 텍스트는 마크다운 블록으로 저장

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface MarkdownBlockProperties {
  // 기본 정보
  content: string;                    // 마크다운 원본 콘텐츠 (TipTap JSON 형식)
  
  // 스타일
  color: ColorToken;                  // 배경 색상
}
```

### 기본 속성

#### 1. content
- **타입**: `string`
- **설명**: 마크다운 원본 콘텐츠 (TipTap JSON 형식으로 저장)
- **기본값**: `''` (빈 문자열)
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '마크다운 내용',
    inputType: 'textarea',
    icon: 'FileText',
    description: '마크다운 형식의 내용',
    placeholder: '내용을 입력하세요...',
    order: 1,
  }
  ```

#### 2. color
- **타입**: `ColorToken`
- **설명**: 블록 배경 색상
- **기본값**: `ColorToken.GRAY`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '배경 색상',
    inputType: 'color',
    icon: 'Palette',
    description: '블록의 배경 색상',
    order: 2,
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
    id: 'basic-info',
    label: '기본 정보',
    description: '블록의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['content'],
  },
  {
    id: 'style',
    label: '스타일',
    description: '블록 스타일 설정',
    defaultCollapsed: true,
    order: 2,
    properties: ['color'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 3,
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

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/markdown.vo.ts
```
**(향후 구현)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/markdown-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/markdown/markdown-block.tsx
```
**(향후 구현)**

**사용 라이브러리**:
- **에디터**: `@tiptap/react` (TipTap)
- **확장 기능**: 
  - `@tiptap/extension-document`
  - `@tiptap/extension-paragraph`
  - `@tiptap/extension-text`
  - `@tiptap/extension-heading`
  - `@tiptap/extension-list-item`
  - `@tiptap/extension-code-block-lowlight` (코드 하이라이팅)
  - 기타 필요한 TipTap 확장 기능

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'markdown' 추가 예정)

## 8. 특이사항 및 주의사항

### 노션 스타일 드래그앤드롭 (향후)
- 각 마크다운 블록 내의 헤딩/리스트 항목을 개별 블록처럼 드래그 가능
- JSON content 구조로 관리
- 블록 간 콘텐츠 이동 시 JSON 업데이트

### 성능 최적화
- 큰 마크다운 문서는 가상 스크롤링 적용
- 렌더링 디바운싱 (500ms)
- 코드 하이라이팅 웹 워커 사용

### 저장 전략
- 자동 저장 (1초 debounce)
- 버전 히스토리 지원 (향후)

### 협업 기능 (향후)
- 실시간 공동 편집 (Yjs 사용)
- 커서 위치 공유
- 코멘트 기능

## 9. 향후 계획

- [ ] **노션 스타일 블록 분리**: 헤딩/리스트를 개별 블록으로 드래그앤드롭
- [ ] **템플릿 지원**: 마크다운 템플릿 라이브러리
- [ ] **내보내기**: PDF, HTML, DOCX 등으로 내보내기
- [ ] **가져오기**: Notion, Obsidian, Roam Research 등에서 가져오기
- [ ] **AI 기능**: 자동 완성, 문법 교정, 톤 조정
- [ ] **협업 기능**: 실시간 공동 편집, 코멘트

