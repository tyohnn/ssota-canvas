# Frontend Specification: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-22  
**최종 수정**: 2025-10-22  
**버전**: v2.0

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: 프론트엔드 구현 (TDD)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Block Management Domain은 **Canvas Management Domain과 긴밀하게 연동되어 블록의 생명주기를 관리**합니다. 블록 생성, 속성 관리, 미디어 업로드, 블록 툴 실행 등 모든 기능은 Canvas 위에서 시각적으로 표현되며, Editor Panel을 통해 편집됩니다.

### User Flow 연결점

- **입력**: `03-user-flow.md` - 5개 주요 화면 흐름
  - Scenario 0: Shadow Block → Skeleton Block → Completed Block
  - Scenario 1: Property 추가/편집 (PropertyInput + Popover 패턴)
  - Scenario 2: Property 값 입력 (useBlockFieldUpdate 패턴)
  - Scenario 3: Media Upload
  - Scenario 4: Block Tools 실행
- **입력**: `03-software-design.md` - BlockAggregate, Custom Properties, Block Tools
- **출력**: React 컴포넌트, Hooks, 블록 타입별 Node 컴포넌트

### 핵심 설계 원칙

- **블록 상태 구분**: Shadow Block (마우스 추적) / Skeleton Block (빈 블록) / Completed Block (렌더링 완료)
- **공통 컴포넌트**: BaseNode 기반 일관된 블록 스타일 (호버, 선택, Resizer, Handle)
- **동적 속성 렌더링**: PropertyInput 컴포넌트로 타입별 동적 UI 생성
- **공통 Hook**: useBlockFieldUpdate로 모든 속성 업데이트 통합 처리
- **Editor Panel**: Notion 스타일 우측 슬라이드 패널
- **Optimistic Update**: 즉각적인 UI 반응 + 백그라운드 DB 동기화

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. DTO 인터페이스

#### BlockView DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Block의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - id: string (Value Object → string 직렬화)
  - workspaceId: string
  - blockType: string (youtube, python, markdown, image, file, link, shape, page_mention, latex, github_pr, react_component)
  - properties: Record<string, any> (JSONB 속성 값)
  - customProperties: Array<CustomPropertyDefinition> (JSONB 커스텀 속성 정의)
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
  - deletedAt: string | null (소프트 삭제용)
- **직렬화 규칙**:
  - Value Object → string 변환
  - Date → ISO 8601 string 변환
  - Plain Object만 사용 (클래스, 함수 금지)
- **특징**: Next.js Server Actions의 직렬화 제약을 준수

**사용 위치**:
- Editor Panel: 블록 상세 정보 표시
- Canvas: 블록 렌더링 정보

---

#### BlockSummary DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Block의 요약 정보를 제공하여 목록 표시 최적화
- **주요 속성**:
  - id: string
  - blockType: string
  - title: string (properties에서 추출)
  - hasCustomProperties: boolean
  - hasMedia: boolean
  - createdAt: string
  - updatedAt: string
- **특징**: 최소한의 정보만 포함하여 목록 조회 성능 향상

**사용 위치**:
- Canvas: 블록 목록 표시
- Editor Panel: 블록 선택 드롭다운

---

#### CustomPropertyDefinition DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: 커스텀 속성 정의 정보를 직렬화
- **주요 속성**:
  - id: string
  - name: string
  - type: string (text, url, email, phone, select, multi-select, status, datetime, media, profile)
  - options?: Array<PropertyOption> (select, multi-select, status 타입용)
  - order: number
  - visible: boolean
- **특징**: 속성 정의와 값 분리 저장 구조

**사용 위치**:
- PropertyInput: 동적 렌더링을 위한 속성 정의
- Field Popover: 속성 편집 UI

---

#### PropertyOption DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: 선택형 속성의 옵션 정보를 직렬화
- **주요 속성**:
  - id: string
  - label: string
  - color: string (hex color)
  - order: number
- **특징**: select, multi-select, status 타입에서 사용

**사용 위치**:
- SelectLikeFieldPopover: 옵션 관리 UI
- PropertyInput: 옵션 선택 UI

---

#### Request DTOs

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Server Actions에 전달되는 입력 데이터 구조 정의
- **CreateBlockRequest**:
  - workspaceId: string (필수)
  - blockType: string (필수)
  - initialMetadata?: Record<string, any>
- **UpdateBlockRequest**:
  - blockId: string (필수)
  - blockType?: string
  - metadata?: Record<string, any>
- **ManageCustomPropertyRequest**:
  - action: 'add' | 'change' | 'delete' | 'reorder' | 'toggle'
  - blockId: string (필수)
  - propertyId?: string
  - name?: string
  - type?: string
  - options?: Array<PropertyOption>
- **ManageMediaRequest**:
  - action: 'upload' | 'delete'
  - blockId: string (필수)
  - propertyId?: string
  - file?: File
- **ExecuteBlockToolRequest**:
  - blockId: string (필수)
  - toolType: string (필수)
  - parameters?: Record<string, any>
  - aiContext?: Record<string, any>
- **특징**: 폼 입력 데이터를 Server Actions에 전달하기 위한 타입

**사용 위치**:
- 블록 생성 폼: CreateBlockRequest
- 블록 편집 폼: UpdateBlockRequest
- 속성 관리: ManageCustomPropertyRequest
- 미디어 관리: ManageMediaRequest
- 툴 실행: ExecuteBlockToolRequest

---

### 2. Result 패턴

- **파일 위치**: `src/domains/block-management/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴
- **주요 속성**:
  - success: boolean (성공 여부)
  - data?: T (성공 시 데이터)
  - error?: E (실패 시 에러)
- **주요 메서드**:
  - isSuccess(): 성공 여부 확인
  - isError(): 실패 여부 확인
- **특징**: try-catch 대신 함수형 에러 처리 패턴 사용

**사용 예시**:
- Server Actions의 반환값으로 사용
- 에러를 명시적으로 처리하여 타입 안전성 확보
- 성공/실패 시나리오를 명확히 분리

---

## 🎯 컴포넌트 설계 (Props 전달 방식)

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계  
> **Canvas Domain 참조**: Canvas Management Domain은 Context 없이 Props 전달 방식 사용

### 핵심 원칙

Block Management Domain은 **Canvas Management Domain과 긴밀하게 연동**되며, 대부분의 상태는 **React Flow가 SSOT**로 관리합니다.

1. **React Flow State = SSOT**: 블록 데이터는 React Flow Store에서 관리 (Canvas Domain 패턴)
2. **Props 전달**: Context 없이 Props를 통한 데이터 전달로 단순화
3. **선택 상태**: React Flow의 선택 상태를 직접 사용 (Canvas Domain 방식)
4. **Optimistic Update**: 모든 업데이트는 React Flow → Server Action 흐름

### Context 불필요 분석

**BlockManagementContext 불필요**:
- ❌ `blocks`: React Flow Store에 이미 존재 (Canvas가 관리)
- ❌ `selectedBlockId`: React Flow 선택 상태 직접 사용
- ❌ `isLoading`: Optimistic Update로 처리
- ❌ `error`: Toast 또는 로컬 상태로 처리
- ❌ `editorPanelOpen`: Canvas Mode로 관리 (`block-editing` 모드)

**최종 구조**:
- ✅ Canvas Management Domain의 React Flow Store 활용
- ✅ Props를 통한 `blockId` 전달
- ✅ Hook에서 직접 Server Action 호출
- ✅ Editor Panel은 Canvas Mode에 따라 렌더링

---

## 🪝 Custom Hooks 설계

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계  
> **Canvas Domain 참조**: Canvas Management Domain의 Hook 패턴 참조

Block Management Domain의 Hook은 **Server Actions를 래핑**하여 Optimistic Update 패턴을 제공합니다.

### 1. useBlockFieldUpdate Hook

#### useBlockFieldUpdate

- **파일 위치**: `src/domains/block-management/frontend/hooks/use-block-field-update.ts`
- **역할**: 블록 속성 값 업데이트를 처리하는 공통 Hook (Canvas의 useNodeFieldUpdate 패턴)
- **주요 기능**:
  - Optimistic Update: React Flow Store 즉시 업데이트
  - Server Action 호출: 백그라운드 DB 동기화
  - 실패 시 롤백
- **제공 메서드**:
  - `updateField(blockId, fieldPath, value)`: 속성 값 업데이트
  - `resetField(blockId, fieldPath)`: 속성 값 초기화
- **의존성**: React Flow Store (`useReactFlow` Hook), Server Actions
- **특징**:
  - 타입별 속성 값 검증
  - 자동 직렬화 (Date, File 등)
  - 에러 처리 및 Toast 알림

**사용 시나리오**:
- PropertyInput: 모든 속성 타입의 값 입력
- Editor Panel: 블록 메타데이터 편집
- Toolbar: 빠른 편집 기능

---

### 2. useSchemaFieldEditor Hook

#### useSchemaFieldEditor

- **파일 위치**: `src/domains/block-management/frontend/hooks/use-schema-field-editor.ts`
- **역할**: 커스텀 속성 정의 관리 Hook (속성 추가/편집/삭제)
- **주요 기능**:
  - 속성 라벨 저장
  - 속성 삭제
  - 속성 복제
  - 옵션 커밋 (select/multi-select/status 타입)
- **제공 메서드**:
  - `saveLabel(blockId, propertyId, label)`: 라벨 저장
  - `deleteField(blockId, propertyId)`: 속성 삭제
  - `duplicateField(blockId, propertyId)`: 속성 복제
  - `commitOptions(blockId, propertyId, options)`: 옵션 저장
- **의존성**: Server Actions (manageCustomPropertyAction)
- **특징**:
  - Optimistic Update 패턴
  - 정의-값 동시 업데이트
  - 에러 처리 및 Toast 알림

**사용 시나리오**:
- Field Popover: 속성 정의 편집
- PropertyInput: 속성 추가/삭제
- Editor Panel: 커스텀 속성 관리

---

### 3. useBlockToolExecution Hook

#### useBlockToolExecution

- **파일 위치**: `src/domains/block-management/frontend/hooks/use-block-tool-execution.ts`
- **역할**: 블록 툴 실행 Hook
- **주요 기능**:
  - 툴 실행 진행률 표시
  - 실행 결과 처리
  - 새 블록 생성 (Canvas Management 연동)
- **제공 메서드**:
  - `executeTool(blockId, toolType, parameters)`: 사용자 툴 실행
  - `executeToolByAI(blockId, toolType, aiContext)`: AI 툴 실행
- **의존성**: Server Actions (executeBlockToolAction), Canvas Hooks
- **특징**:
  - 진행률 상태 관리
  - 실행 결과 파싱
  - Canvas 연동 (새 블록 마운트)

**사용 시나리오**:
- BlockToolbar: 툴 버튼 클릭
- AI Agent: 자동 툴 실행

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. 블록 타입별 컴포넌트 구조 ⭐ NEW

Block Management Domain은 **블록 타입별로 폴더를 분리**하여 Shadow Block, Completed Block을 통합 관리합니다.

#### 폴더 구조

```
src/domains/block-management/frontend/components/block/
├── [type]/                           # 블록 타입별 폴더
│   ├── youtube/
│   │   ├── youtube-block.tsx         # YouTube 블록 (Skeleton + Completed 통합)
│   │   ├── youtube-block.types.ts    # YouTube 블록 타입 정의 (기본 속성, 스타일)
│   │   └── youtube-shadow-block.tsx  # YouTube Shadow Block
│   ├── python/
│   │   ├── python-block.tsx          # Python 블록
│   │   ├── python-block.types.ts     # Python 블록 타입 정의
│   │   └── python-shadow-block.tsx   # Python Shadow Block
│   ├── markdown/
│   │   ├── markdown-block.tsx
│   │   ├── markdown-block.types.ts
│   │   └── markdown-shadow-block.tsx
│   └── ...                           # 기타 블록 타입들
└── base-block-node.tsx               # 공통 BaseNode 컴포넌트 (조건부 렌더링)
```

#### BaseNode 컴포넌트 (조건부 렌더링)

- **파일 위치**: `src/domains/block-management/frontend/components/block/base-block-node.tsx`
- **역할**: 모든 블록의 공통 래퍼, 타입별 컴포넌트를 조건부 렌더링
- **주요 기능**:
  - 블록 타입별 컴포넌트 동적 선택 (youtube → YoutubeBlock, python → PythonBlock 등)
  - 공통 스타일 (호버, 선택, Resizer, Handle)
  - 블록 상태 구분 (skeleton, completed)
- **Props**:
  - blockId: string (필수)
  - blockType: string (필수)
  - data: BlockNodeData (블록 데이터)
  - state: 'skeleton' | 'completed' (블록 상태)
- **UI 라이브러리**: BaseNode (shadcn/ui), Handle, Resizer
- **특징**:
  - 타입별 컴포넌트 Map 사용 (blockTypeComponentMap)
  - Skeleton 상태: 빈 플레이스홀더 표시
  - Completed 상태: 완전한 렌더링

**조건부 렌더링 패턴**:
```typescript
const blockTypeComponentMap = {
  youtube: YoutubeBlock,
  python: PythonBlock,
  markdown: MarkdownBlock,
  // ... 기타 타입들
};

const BlockComponent = blockTypeComponentMap[blockType] || DefaultBlock;

return (
  <BaseNode {...commonProps}>
    <BlockComponent data={data} state={state} />
  </BaseNode>
);
```

**사용 위치**:
- Canvas: 모든 블록의 기본 래퍼
- React Flow NodeTypes 등록

---

#### 개별 블록 컴포넌트 (Skeleton + Completed 통합)

##### YoutubeBlock 예시

- **파일 위치**: `src/domains/block-management/frontend/components/block/youtube/youtube-block.tsx`
- **역할**: YouTube 블록 렌더링 (Skeleton과 Completed 상태 통합)
- **주요 기능**:
  - Skeleton 상태: YouTube 아이콘 + "Add YouTube URL" 플레이스홀더
  - Completed 상태: YouTube 임베드 플레이어 렌더링
- **Props**:
  - data: BlockNodeData (필수)
  - state: 'skeleton' | 'completed' (필수)
- **사용 Hook**: useBlockFieldUpdate (속성 값 업데이트용)
- **UI 라이브러리**: YouTube Embed, Input, Icon
- **특징**:
  - 상태별 조건부 렌더링
  - 공통 스타일 유지 (BaseNode 기반)
  - 속성 값 실시간 업데이트

**구현 패턴**:
```typescript
export function YoutubeBlock({ data, state }: YoutubeBlockProps) {
  const { updateField } = useBlockFieldUpdate();
  
  if (state === 'skeleton') {
    return (
      <div className="skeleton-state">
        <YoutubeIcon />
        <span>Add YouTube URL</span>
      </div>
    );
  }
  
  return (
    <div className="completed-state">
      <YouTubeEmbed url={data.properties.url} />
    </div>
  );
}
```

---

#### 블록 타입 정의 파일

##### youtube-block.types.ts 예시

- **파일 위치**: `src/domains/block-management/frontend/components/block/youtube/youtube-block.types.ts`
- **역할**: YouTube 블록의 타입 정의, 기본 속성, 스타일 설정
- **주요 내용**:
  - YoutubeBlockData 인터페이스 (properties 타입)
  - 기본 속성 정의 (필수: url, 선택: title, description)
  - 기본 스타일 설정 (width, height, aspectRatio)
  - 검증 함수 (isValidYoutubeUrl)

**구현 예시**:
```typescript
export interface YoutubeBlockData extends BlockNodeData {
  properties: {
    url: string;           // 필수
    title?: string;        // 선택
    description?: string;  // 선택
  };
}

export const YOUTUBE_BLOCK_DEFAULT_PROPERTIES = {
  url: '',
  title: '',
  description: '',
};

export const YOUTUBE_BLOCK_DEFAULT_STYLE = {
  width: 560,
  height: 315,
  aspectRatio: '16/9',
};

export function isValidYoutubeUrl(url: string): boolean {
  return /^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(url);
}
```

---

#### Shadow Block 컴포넌트

##### YoutubeShadowBlock 예시

- **파일 위치**: `src/domains/block-management/frontend/components/block/youtube/youtube-shadow-block.tsx`
- **역할**: 마우스를 따라다니는 YouTube Shadow Block
- **주요 기능**:
  - 마우스 포인터 추적
  - 블록 크기 프리뷰 (YOUTUBE_BLOCK_DEFAULT_STYLE 사용)
  - 클릭 시 Skeleton Block 생성
- **사용 Hook**: useCanvasMode, useCanvasBlockLifecycle
- **UI 라이브러리**: React Flow, Mouse Position Tracking
- **특징**:
  - 반투명 배경 (opacity: 30%)
  - 타입별 기본 크기 사용
  - 십자형(+) 커서

**사용 위치**:
- Canvas: 블록 생성 모드 (`block-creation` 모드)
- 블록 타입 선택 후 마우스 추적

---

### 2. Editor Panel Component ⭐ NEW

#### EditorPanel (Block Management 전용)

- **파일 위치**: `src/domains/block-management/frontend/components/editor/editor-panel.tsx`
- **역할**: Notion 스타일 우측 슬라이드 패널 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - 우측에서 슬라이드 인 (45% 너비, 90% 높이)
  - 블록 정보 표시 및 편집
  - Style Section, Property Section
- **Props**:
  - blockId: string (필수) - Props로 전달받음
  - isOpen: boolean - Canvas Mode (`block-editing`)로 제어
- **사용 Hook**: 
  - useBlockFieldUpdate (속성 값 업데이트)
  - useSchemaFieldEditor (속성 정의 관리)
  - useReactFlow (React Flow Store에서 블록 데이터 읽기)
- **UI 라이브러리**: Slide-in Animation, Backdrop Blur
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/editor-panel.tsx` UI 구조 복제
  - **Hook은 새로 정의**: Block Management 전용 Hook 사용
  - 반투명 배경 + backdrop-blur
  - 슬라이드 애니메이션 (300ms, ease-out)
  - 닫기 버튼 (ChevronsRight 아이콘)

**구현 패턴**:
```typescript
export function EditorPanel({ blockId, isOpen }: EditorPanelProps) {
  const { updateField } = useBlockFieldUpdate();
  const { getNode } = useReactFlow();
  
  // React Flow Store에서 블록 데이터 읽기
  const blockNode = getNode(blockId);
  const blockData = blockNode?.data;
  
  if (!isOpen || !blockData) return null;
  
  return (
    <div className="fixed right-0 top-0 w-[45%] h-[90%] bg-background/70 backdrop-blur">
      <PropertySection blockId={blockId} blockData={blockData} />
      <StyleSection blockId={blockId} blockData={blockData} />
    </div>
  );
}
```

**사용 위치**:
- Canvas: `block-editing` 모드일 때 렌더링
- Props로 blockId 전달

---

### 3. PropertyInput Component ⭐ NEW

#### PropertyInput (Block Management 전용)

- **파일 위치**: `src/domains/block-management/frontend/components/editor/property-input/property-input.tsx`
- **역할**: 속성 타입별 동적 입력 필드 렌더링 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - 타입별 동적 렌더링 (text, url, email, phone, select, multi-select, status, datetime, media, profile)
  - 3-column grid 레이아웃
  - 실시간 자동 저장
- **Props**:
  - blockId: string (필수)
  - field: CustomPropertyDefinition (필수)
  - value: any (현재 값)
- **사용 Hook**: 
  - useBlockFieldUpdate (속성 값 업데이트)
- **UI 라이브러리**: Input, Dropdown, Checkbox, DatePicker, FileUpload
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/property-input/property-input.tsx` UI 구조 복제
  - **Hook은 새로 정의**: useBlockFieldUpdate 사용
  - 타입별 전용 Input 컴포넌트
  - 자동 저장 (디바운스 없음)
  - 에러 처리 및 검증

**구현 패턴**:
```typescript
export function PropertyInput({ blockId, field, value }: PropertyInputProps) {
  const { updateField } = useBlockFieldUpdate();
  
  const handleChange = (newValue: any) => {
    updateField(blockId, field.id, newValue);
  };
  
  switch (field.type) {
    case 'text': return <TextInput value={value} onChange={handleChange} />;
    case 'select': return <SelectInput options={field.options} value={value} onChange={handleChange} />;
    case 'multi-select': return <MultiSelectProperty options={field.options} value={value} onChange={handleChange} />;
    // ... 기타 타입들
  }
}
```

**사용 위치**:
- Editor Panel: Property Section
- 블록 편집: 속성 값 입력

---

#### MultiSelectProperty Component ⭐ NEW

- **파일 위치**: `src/domains/block-management/frontend/components/editor/property-input/multi-select-property.tsx`
- **역할**: Multi-select 타입 전용 컴포넌트 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - 선택된 옵션들 Badge 표시 (X 버튼으로 개별 삭제)
  - Dropdown 메뉴 (Checkbox로 다중 선택)
  - 선택된 옵션 개수 표시
  - "모두 선택" / "모두 해제" 버튼
- **Props**:
  - blockId: string (필수)
  - fieldId: string (필수)
  - options: PropertyOption[] (필수)
  - value: string[] (선택된 옵션 ID 배열)
- **사용 Hook**: useBlockFieldUpdate
- **UI 라이브러리**: Popover, Checkbox, Badge, Button
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/property-input/multi-select-property.tsx` UI 구조 복제
  - **Hook은 새로 정의**: useBlockFieldUpdate 사용
  - 중첩 Popover 구조
  - 실시간 선택/해제
  - 자동 저장

**사용 위치**:
- PropertyInput: multi-select 타입 속성
- Field Popover: 옵션 관리

---

### 4. Field Popover Components ⭐ NEW

Block Management Domain 전용으로 **레거시 UI를 복제**하되, **Hook은 새롭게 정의**합니다.

#### GenericFieldPopover

- **파일 위치**: `src/domains/block-management/frontend/components/editor/property-detail-popover/generic-field-popover.tsx`
- **역할**: 기본 속성 편집 팝오버 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - Label 입력 필드 (자동 저장)
  - Duplicate, Delete 버튼
- **Props**:
  - blockId: string (필수)
  - field: CustomPropertyDefinition (필수)
- **사용 Hook**: useSchemaFieldEditor
- **UI 라이브러리**: Popover, Input, Button
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/property-detail-popover/generic-field-popover.tsx` UI 구조 복제
  - **Hook은 새로 정의**: useSchemaFieldEditor 사용
  - 자동 저장 (useEffect로 디바운스)
  - 중첩 Popover 구조

**사용 위치**:
- PropertyInput: 속성 라벨 클릭 시
- text, url, email, phone, datetime, media, profile 타입

---

#### SelectLikeFieldPopover

- **파일 위치**: `src/domains/block-management/frontend/components/editor/property-detail-popover/select-like-field-popover.tsx`
- **역할**: 선택형 속성 편집 팝오버 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - Label 입력 필드
  - Options 섹션 (옵션 목록, 추가 버튼)
  - 중첩 OptionEditPopover
- **Props**:
  - blockId: string (필수)
  - field: CustomPropertyDefinition (필수)
- **사용 Hook**: useSchemaFieldEditor
- **UI 라이브러리**: Popover, Badge, Button
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/property-detail-popover/select-like-field-popover.tsx` UI 구조 복제
  - **Hook은 새로 정의**: useSchemaFieldEditor 사용
  - 중첩 Popover 구조
  - 옵션별 색상 관리
  - 실시간 옵션 추가/삭제

**사용 위치**:
- PropertyInput: select, multi-select 타입
- 옵션 관리: 옵션 추가/편집/삭제

---

#### StatusFieldPopover

- **파일 위치**: `src/domains/block-management/frontend/components/editor/property-detail-popover/status-field-popover.tsx`
- **역할**: 상태 속성 편집 팝오버 (Block Management 전용으로 새롭게 구현)
- **주요 기능**:
  - Label 입력 필드
  - Status Groups 섹션 (진행전/진행중/완료)
  - 그룹별 옵션 관리
- **Props**:
  - blockId: string (필수)
  - field: CustomPropertyDefinition (필수)
- **사용 Hook**: useSchemaFieldEditor
- **UI 라이브러리**: Popover, Badge, Button
- **특징**:
  - **레거시 UI 복제**: `react-flow-canvas/components/editor/property-detail-popover/status-field-popover.tsx` UI 구조 복제
  - **Hook은 새로 정의**: useSchemaFieldEditor 사용
  - 그룹별 옵션 관리
  - 상태별 색상 구분

**사용 위치**:
- PropertyInput: status 타입
- 상태 관리: 그룹별 옵션 관리

---

### 중요: UI 복제 + Hook 새로 정의 전략

모든 Editor Panel 및 Property 관련 컴포넌트는:
1. **UI 레이어**: 레거시 코드(`react-flow-canvas/components/editor/`) 복제
2. **Hook 레이어**: Block Management 전용 Hook으로 교체 (useBlockFieldUpdate, useSchemaFieldEditor)
3. **Props 레이어**: Props로 blockId 전달받아 React Flow Store 접근

---

### 5. Block Toolbar Component

#### BlockMountToolbar

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-mount-toolbar.tsx`
- **역할**: 블록별 툴 실행 버튼
- **주요 기능**:
  - 블록 타입별 툴 버튼 표시
  - 툴 실행 진행률 표시
  - 권한별 버튼 활성화/비활성화
- **사용 Hook**: useBlockManagement
- **UI 라이브러리**: Button, Progress, Tooltip
- **특징**:
  - 블록 타입별 동적 툴 목록
  - 권한 기반 UI 제어
  - 실행 진행률 표시

**사용 위치**:
- Canvas: 블록 선택 시 상단 표시
- 블록 툴 실행: 사용자/AI 실행

---

## 🔗 앱 레벨 통합

> **가이드 참조**: Phase 3.2 - 앱 레벨 통합 설계

### 1. Provider 중첩 순서

**Root Layout 통합** (Context 없음):
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WorkspaceManagementProvider>
            {children}
          </WorkspaceManagementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Provider 순서 원칙**:
- ✅ **BlockManagementProvider 불필요**: React Flow Store가 상태 관리
- ✅ AuthProvider는 가장 상위
- ✅ WorkspaceManagementProvider가 Auth 다음
- ✅ Canvas 페이지에서 ReactFlowProvider 설정

---

### 2. 초기 데이터 전달 (Canvas Domain 패턴)

**Server Components에서 데이터 로드**:
```typescript
// page.tsx (Canvas Management Domain)
async function PageContent({ pageId }) {
  // 서버에서 캔버스 데이터 로드 (블록 정보 포함)
  const pageDataResult = await getCanvasPageDataAction(pageId);
  
  // ACL 변환: DB 데이터 → React Flow 초기 데이터
  const initialNodes = pageData.blockMounts.map(blockMount => {
    const block = pageData.blocks.find(b => b.id === blockMount.blockId);
    return block ? toReactFlowNode(block, blockMount) : null;
  }).filter(Boolean);
  
  // CanvasClient에 초기 데이터 전달
  return (
    <CanvasClient
      pageId={pageId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}
```

**데이터 흐름**:
1. page.tsx (서버) → getCanvasPageDataAction → DB 조회 (블록 정보 포함)
2. page.tsx (서버) → ACL 변환 → initialNodes (블록 데이터 포함)
3. CanvasClient → ReactFlowProvider 설정
4. CanvasReactFlowWrapper → React Flow 상태 초기화
5. 사용자 인터랙션 → React Flow 이벤트 → Hook → Server Actions → DB 저장

---

### 3. 페이지에서 Hook 사용

**Canvas 컴포넌트**:
```typescript
// canvas-react-flow-wrapper.tsx
export function CanvasReactFlowWrapper({ pageId, initialNodes, initialEdges }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Block Management Hooks
  const { updateField } = useBlockFieldUpdate();
  const { saveLabel, deleteField } = useSchemaFieldEditor();
  const { executeTool } = useBlockToolExecution();
  
  // Canvas Mode로 Editor Panel 제어
  const { isBlockEditingMode, getCurrentMode } = useCanvasMode();
  const currentMode = getCurrentMode();
  
  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange}>
      {/* Editor Panel은 Canvas Mode로 렌더링 */}
      {isBlockEditingMode() && currentMode.type === 'block-editing' && (
        <EditorPanel blockId={currentMode.blockId} isOpen={true} />
      )}
    </ReactFlow>
  );
}
```

### 4. Canvas Management Domain 연동

**Canvas 연동 패턴**:
```typescript
// src/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle.ts
export function useCanvasBlockLifecycle({ pageId, orgId }) {
  const { createBlock, updateBlock, deleteBlock } = useBlockManagement();
  
  // 1. Shadow Block 상태 → Skeleton Block 생성
  const result = await createBlock(blockType, position, workspaceId, orgId);
  
  // 2. Optimistic 업데이트: Canvas에 즉시 표시
  // 3. Server Action 호출: BlockManagementService.createBlock()
  // 4. 성공 시: Completed Block으로 전환
  // 5. 실패 시: 롤백 및 에러 표시
}
```

**블록 상태 관리**:
```typescript
// 블록 상태별 컴포넌트 분리
type BlockState = 'shadow' | 'skeleton' | 'completed';

// Shadow Block: 마우스 추적
<SkeletonBlock blockType={blockType} />

// Skeleton Block: 빈 상태
<BasicBlockNode block={block} state="skeleton" />

// Completed Block: 완전 렌더링
<YoutubeBlockNode block={block} state="completed" />
```

**Editor Panel 연동**:
```typescript
// src/domains/react-flow-canvas/components/editor/editor-panel.tsx
export function EditorPanel() {
  const { selectedBlock, editorPanelOpen, closeEditorPanel } = useBlockManagement();
  
  if (!selectedBlock || !editorPanelOpen) return null;
  
  return (
    <div className="fixed right-0 top-0 w-[45%] h-[90%] bg-background/70 backdrop-blur">
      <PropertySection block={selectedBlock} />
      <StyleSection block={selectedBlock} />
    </div>
  );
}
```

---

## 🚀 Server Actions 연동

> **가이드 참조**: Phase 2.4 Part 1 - Server Actions 연동

### 1. Server Actions 구현

#### createBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 생성 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - 의존성 주입 패턴으로 Service Layer 활용
  - Command 객체 생성 및 Service 메서드 호출
  - 도메인 모델 → DTO 직렬화
- **입력**: FormData (workspaceId, blockType, initialMetadata)
- **출력**: BlockDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 권한 부족 → WorkspaceAccessDeniedError
  - 도메인 규칙 위반 → BlockManagementError
- **특징**:
  - `'use server'` 지시어 사용
  - Plain Object만 반환 (직렬화 가능)
  - 의존성 주입으로 테스트 용이성 확보

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 의존성 주입: Repository, Service 인스턴스 생성
3. Command 생성: 입력 파라미터 → CreateBlockCommand 객체 변환
4. 도메인 로직 실행: BlockManagementService.createBlock() 호출
5. DTO 직렬화: Block Aggregate → BlockDTO 변환
6. 결과 반환: Result<BlockDTO> 형식

#### updateBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 정보 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: FormData (blockId, blockType?, metadata?)
- **출력**: BlockDTO
- **처리 흐름**: createBlockAction과 유사하나 수정 로직 적용

#### deleteBlockAction

- **파일 위치**: `src/domains/block-management/actions/block.actions.ts`
- **역할**: 블록 삭제 기능을 제공하는 Next.js Server Action
- **입력**: FormData (blockId)
- **출력**: void
- **처리 흐름**: 소프트 삭제 로직 적용

#### manageCustomPropertyAction

- **파일 위치**: `src/domains/block-management/actions/property.actions.ts`
- **역할**: 커스텀 속성 관리 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - AddCustomProperty, ChangePropertyType, DeleteCustomProperty 처리
  - 속성 타입별 검증
  - 정의-값 동시 업데이트
- **입력**: FormData (action, blockId, propertyId?, name?, type?, options?)
- **출력**: PropertyDTO
- **처리 흐름**: 속성 관리 로직 적용

#### manageMediaAction

- **파일 위치**: `src/domains/block-management/actions/media.actions.ts`
- **역할**: 미디어 파일 관리 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - UploadMedia, DeleteMediaFile 처리
  - 파일 크기/MIME 타입 검증
  - Supabase Storage 연동
- **입력**: FormData (action, blockId, file?, propertyId?)
- **출력**: MediaDTO
- **처리 흐름**: 미디어 관리 로직 적용

#### executeBlockToolAction

- **파일 위치**: `src/domains/block-management/actions/tool.actions.ts`
- **역할**: 블록 툴 실행 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - ExecuteBlockTool, ExecuteBlockToolByAI 처리
  - 툴 타입별 검증
  - 실행 결과 파싱
- **입력**: FormData (blockId, toolType, parameters?, aiContext?)
- **출력**: ToolResultDTO
- **처리 흐름**: 툴 실행 로직 적용

---

## ✅ 검증 체크리스트

### DTO 타입 정의
- [ ] DTO 인터페이스가 Plain Object로 정의되었는가?
- [ ] Date 객체가 ISO 문자열로 직렬화되었는가?
- [ ] Value Object가 string으로 직렬화되었는가?
- [ ] Next.js Server Actions 직렬화 제약을 준수하는가?

### Props 전달 방식 (Context 없음)
- [ ] BlockManagementContext가 없는가? (React Flow Store 사용)
- [ ] Props를 통해 blockId가 컴포넌트 간 전달되는가?
- [ ] React Flow Store가 SSOT로 관리되는가?
- [ ] 선택 상태를 React Flow 선택 상태로 직접 사용하는가?
- [ ] Canvas Mode로 Editor Panel 열림 상태를 제어하는가?

### Server Actions 연동
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [ ] Command 객체를 활용하여 입력을 구조화했는가?
- [ ] DTO 직렬화가 올바르게 구현되었는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### Hook 구현
- [ ] useBlockFieldUpdate Hook이 Optimistic Update 패턴을 구현하는가?
- [ ] useSchemaFieldEditor Hook이 속성 정의 관리를 담당하는가?
- [ ] useBlockToolExecution Hook이 툴 실행 로직을 캡슐화하는가?
- [ ] React Flow Store에서 블록 데이터를 직접 읽는가?
- [ ] 에러 상태가 적절히 처리되는가?

### 블록 컴포넌트 구조
- [ ] 블록 타입별 폴더 구조가 구현되었는가? (`block/[type]/`)
- [ ] BaseNode에서 타입별 조건부 렌더링이 구현되었는가?
- [ ] Skeleton과 Completed 상태가 하나의 컴포넌트로 통합되었는가?
- [ ] 블록 타입 정의 파일(`.types.ts`)이 있는가?
- [ ] Shadow Block 컴포넌트가 타입별로 분리되었는가?

### Editor Panel & Property Components
- [ ] EditorPanel이 Block Management 도메인에 새롭게 구현되었는가?
- [ ] PropertyInput이 Block Management 도메인에 새롭게 구현되었는가?
- [ ] Field Popover가 Block Management 도메인에 새롭게 구현되었는가?
- [ ] 레거시 UI 구조를 복제하되 Hook은 새로 정의했는가?
- [ ] Props로 blockId를 전달받아 React Flow Store에 접근하는가?

### 앱 통합
- [ ] BlockManagementProvider가 제거되었는가?
- [ ] Canvas Management Domain의 React Flow Store를 활용하는가?
- [ ] Canvas Mode로 UI 렌더링을 제어하는가?
- [ ] Optimistic Update 패턴이 모든 업데이트에 적용되었는가?

### User Flow ↔ Frontend Specification 일관성 검증
- [ ] User Flow의 모든 화면이 컴포넌트로 구현되었는가?
- [ ] UI 요소가 모두 React 컴포넌트로 매핑되었는가?
- [ ] 사용자 인터랙션이 Hook 메서드로 정의되었는가?
- [ ] 블록 상태별 컴포넌트가 적절히 분리되었는가? (Shadow/Skeleton/Completed)
- [ ] PropertyInput이 타입별로 동적 렌더링되는가?
- [ ] Field Popover가 중첩 구조로 구현되었는가?
- [ ] Editor Panel이 Notion 스타일로 구현되었는가?

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components)
- **내용**:
  - Context 구현 및 Provider 설정
  - Custom Hooks 구현
  - UI 컴포넌트 구현
  - React Testing Library로 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

```
src/domains/block-management/
├── shared/
│   ├── dtos/
│   │   └── index.ts                            # DTO 인터페이스들
│   ├── types/
│   │   └── index.ts                            # Result 패턴 및 공통 타입
│   ├── commands/                               # Command 객체들
│   └── errors/                                 # 에러 타입들
│
├── frontend/
│   ├── hooks/
│   │   ├── use-block-field-update.ts           # ⭐ 블록 속성 값 업데이트 Hook
│   │   ├── use-schema-field-editor.ts          # ⭐ 커스텀 속성 정의 관리 Hook
│   │   └── use-block-tool-execution.ts         # ⭐ 블록 툴 실행 Hook
│   │
│   ├── components/
│   │   ├── block/                              # ⭐ 블록 타입별 컴포넌트
│   │   │   ├── base-block-node.tsx             # 공통 BaseNode (조건부 렌더링)
│   │   │   ├── youtube/
│   │   │   │   ├── youtube-block.tsx           # YouTube 블록 (Skeleton + Completed)
│   │   │   │   ├── youtube-block.types.ts      # YouTube 타입 정의
│   │   │   │   └── youtube-shadow-block.tsx    # YouTube Shadow Block
│   │   │   ├── python/
│   │   │   │   ├── python-block.tsx
│   │   │   │   ├── python-block.types.ts
│   │   │   │   └── python-shadow-block.tsx
│   │   │   ├── markdown/
│   │   │   │   ├── markdown-block.tsx
│   │   │   │   ├── markdown-block.types.ts
│   │   │   │   └── markdown-shadow-block.tsx
│   │   │   └── ...                             # 기타 블록 타입들
│   │   │
│   │   └── editor/                             # ⭐ Editor Panel & Property Components
│   │       ├── editor-panel.tsx                # Block Management 전용 Editor Panel
│   │       ├── property-input/
│   │       │   ├── property-input.tsx          # Block Management 전용 PropertyInput
│   │       │   └── multi-select-property.tsx   # Block Management 전용 MultiSelect
│   │       └── property-detail-popover/
│   │           ├── generic-field-popover.tsx   # Block Management 전용
│   │           ├── select-like-field-popover.tsx # Block Management 전용
│   │           └── status-field-popover.tsx    # Block Management 전용
│
└── actions/
    ├── block.actions.ts                        # 블록 관련 Server Actions
    ├── property.actions.ts                     # 속성 관련 Server Actions
    ├── media.actions.ts                        # 미디어 관련 Server Actions
    └── tool.actions.ts                         # 툴 관련 Server Actions

# Canvas Management Domain 연동
src/domains/canvas-management/frontend/
├── components/
│   └── canvas-react-flow-wrapper.tsx           # React Flow 인스턴스 (Editor Panel 렌더링)
└── hooks/
    ├── use-canvas-mode.ts                      # Canvas 모드 관리
    └── use-canvas-block-lifecycle.ts           # 블록 생명주기 Hook
```

**폴더 구조 핵심 포인트**:
1. ✅ **Context 제거**: `contexts/` 폴더 없음
2. ✅ **블록 타입별 폴더**: `block/[type]/` 구조로 분리
3. ✅ **Editor Panel 분리**: Block Management 전용으로 새로 구현
4. ✅ **Hook 중심**: 상태 관리는 React Flow Store + Server Actions Hook
5. ✅ **Props 전달**: blockId를 Props로 전달하여 컴포넌트 간 통신

---

## 📋 문서 변경 이력

### v2.0 (2025-10-22) ⭐ 주요 아키텍처 변경
- **Context 제거**: BlockManagementContext 불필요, React Flow Store 직접 활용
- **Props 전달 방식 도입**: Canvas Domain 패턴 참조, blockId를 Props로 전달
- **선택 상태 변경**: React Flow 선택 상태 직접 사용
- **쿠키 제거**: Canvas에서 처리, Block Management에서는 불필요
- **불필요한 검색 메서드 제거**: React Flow Store에 이미 데이터 존재
- **블록 컴포넌트 구조 개선**:
  - 블록 타입별 폴더 구조 (`block/[type]/`)
  - BaseNode에서 조건부 렌더링
  - Skeleton + Completed 통합
  - 블록 타입 정의 파일 (`.types.ts`) 추가
- **Editor Panel & Property Components 분리**:
  - Block Management 도메인에 새롭게 구현
  - 레거시 UI 복제, Hook은 새로 정의
  - useBlockFieldUpdate, useSchemaFieldEditor, useBlockToolExecution 사용
- **검증 체크리스트 업데이트**: Props 전달, 블록 구조, Editor Panel 분리
- **폴더 구조 대폭 수정**: Context 제거, 블록 타입별 폴더, Editor 분리

### v1.0 (2025-10-22)
- 초안 작성
- DTO 및 타입 정의
- Context 및 Hooks 설계
- UI 컴포넌트 설계

---

이 Frontend Specification을 따라 **User Flow 기반의 Block Management Domain 프론트엔드**를 구현할 수 있습니다! 🎨
