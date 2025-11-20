# Shadcn Registry 블록 (Shadcn Registry Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `shadcn_registry` (신규)
- **Enum**: 추가 필요
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
Shadcn UI 컴포넌트 레지스트리를 표시하는 블록입니다. 컴포넌트 브라우징, 프리뷰, 코드 복사 기능을 제공합니다.

### 사용 사례
- UI 컴포넌트 라이브러리 문서화
- 컴포넌트 북 (Storybook 대체)
- 디자인 시스템 관리
- 컴포넌트 재사용

## 2. UI 정의

### 기본 UI
- **프리뷰 모드** (iframe으로 렌더링)
  - 선택된 Shadcn 컴포넌트 라이브 프리뷰
  - 블록 내부 상단 메뉴: 모드 토글, 코드 복사, 설치 복사, 다운로드
- **코드 모드**
  - 컴포넌트 코드 표시
  - 의존성 코드 표시
  - 블록 내부 상단 메뉴: 모드 토글, 코드 복사, 설치 복사, 다운로드
- 모드 토글로 프리뷰 ↔ 코드 전환

### 기본 크기
```typescript
{
  width: 450,   // 픽셀
  height: 400   // 픽셀 (컴포넌트에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**있음** - 컴포넌트 에디터 & 브라우저
- **컴포넌트 선택 모드** (쇼핑몰 스타일)
  - 컴포넌트 검색
  - 카테고리별 필터
  - 컴포넌트 미리보기
  - 선택 시 블록 데이터 변경 (componentName, category, codeUrl 등)
- **에디터 모드** (Chrome DevTools 스타일)
  - 라이브 프리뷰 (iframe)
  - Props 인풋 패널 (정형적 입력 UI)
  - 컴포넌트 요소 선택 및 수정
  - 코드 직접 편집 가능
  - 실시간 반영

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "Shadcn Registry" 선택
2. 컴포넌트 검색/선택 다이얼로그 표시
3. 컴포넌트 선택 (예: Button, Card, Dialog)
4. 블록 생성 및 Supabase Storage에서 코드 로드

### 붙여넣기 방식
**없음**

## 4. 속성 정의 (Properties)

```typescript
export interface ShadcnRegistryBlockProperties {
  // 컴포넌트 정보
  componentName: string;              // 컴포넌트 이름 (button, card, dialog 등)
  category: string;                   // 카테고리 (forms, layout, data-display 등)
  
  // Supabase Storage URL
  codeUrl: string;                    // 컴포넌트 코드 파일 URL
  dependenciesUrls: string[];         // 의존성 코드 파일 URL 배열
  
  // Props 설정 (사용자 수정 가능)
  propsConfig?: Record<string, any>;  // 컴포넌트 props 설정
  
  // 테마
  color: ColorToken;                  // 블록 배경 색상
}

// Note: 
// - 모든 Shadcn 컴포넌트 코드와 의존성은 Supabase Storage에 저장되어 있습니다.
// - 블록은 codeUrl과 dependenciesUrls를 통해 코드를 로드합니다.
// - 프리뷰는 iframe을 통해 격리된 환경에서 렌더링됩니다.
// - 블록 내부 모드 토글(프리뷰/코드)은 블록 자체 상태로 관리되며 Properties에 포함되지 않습니다.
// - 설치 명령(installCommand)은 componentName을 기반으로 자동 생성됩니다.
```

### 기본 속성

#### 1. componentName
- **타입**: `string`
- **설명**: Shadcn 컴포넌트 이름
- **기본값**: `'button'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '컴포넌트',
    inputType: 'text',
    icon: 'Component',
    description: 'Shadcn UI 컴포넌트 이름',
    placeholder: 'button',
    order: 1,
  }
  ```

#### 2. category
- **타입**: `string`
- **설명**: 컴포넌트 카테고리
- **기본값**: `'forms'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '카테고리',
    inputType: 'select',
    icon: 'FolderTree',
    description: '컴포넌트 카테고리',
    order: 2,
    options: [
      { value: 'forms', label: 'Forms' },
      { value: 'layout', label: 'Layout' },
      { value: 'data-display', label: 'Data Display' },
      { value: 'feedback', label: 'Feedback' },
      { value: 'navigation', label: 'Navigation' },
      { value: 'overlay', label: 'Overlay' },
    ],
  }
  ```

#### 3. codeUrl
- **타입**: `string`
- **설명**: Supabase Storage의 컴포넌트 코드 URL
- **기본값**: `''`
- **필수**: ✅ Yes

#### 4. dependenciesUrls
- **타입**: `string[]`
- **설명**: 의존성 코드 파일 URL 배열
- **기본값**: `[]`
- **필수**: ✅ Yes

#### 5. propsConfig
- **타입**: `Record<string, any>`
- **설명**: 컴포넌트 props 설정 (블록 스페이스에서 수정)
- **기본값**: `{}`
- **필수**: ❌ No

#### 6. color
- **타입**: `ColorToken`
- **설명**: 블록 배경 색상
- **기본값**: `ColorToken.BLUE_500`
- **필수**: ✅ Yes

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
    description: 'Shadcn 컴포넌트 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['componentName', 'category', 'color'],
  },
  {
    id: 'storage',
    label: '저장소',
    description: 'Supabase Storage URL',
    defaultCollapsed: true,
    order: 2,
    properties: ['codeUrl', 'dependenciesUrls'],
  },
  {
    id: 'props',
    label: 'Props',
    description: '컴포넌트 Props 설정',
    defaultCollapsed: true,
    order: 3,
    properties: ['propsConfig'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 4,
    properties: ['createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템 (Mount Toolbar)

### 1. ColorToolbarItem
- **아이콘**: `Palette`
- **기능**: 블록 색상 변경
- **동작**: 색상 선택 Popover 표시

### 2. OpenBlockSpaceToolbarItem
- **아이콘**: `Maximize2`
- **기능**: 블록 스페이스 열기
- **동작**: 전체 화면 컴포넌트 에디터 열기

**Note**: Mount Toolbar는 블록 선택 시 나타나는 외부 툴바로, 기본 속성의 빠른 편집과 액션을 위한 것입니다.

## 5-1. 블록 내부 메뉴

블록 내부 상단에 박혀있는 메뉴 (툴바 아이템이 아님):

### 1. 모드 토글
- **아이콘**: `Eye` / `Code`
- **기능**: 프리뷰 모드 ↔ 코드 모드 전환
- **동작**: 블록 렌더링 모드 변경 (블록 내부 상태)

### 2. 코드 복사 버튼
- **아이콘**: `Copy`
- **기능**: 컴포넌트 코드 복사
- **동작**: 클립보드에 코드 복사

### 3. 설치 명령 복사 버튼
- **아이콘**: `Terminal`
- **기능**: 설치 명령 복사
- **동작**: `npx shadcn-ui@latest add [component]` 복사

### 4. 다운로드 버튼
- **아이콘**: `Download`
- **기능**: 컴포넌트 파일 다운로드
- **동작**: 컴포넌트 코드와 의존성 파일 zip 다운로드

## 6. 블록 툴

### 1. 컴포넌트 → 코드 블록 변환 (Export to Code Block)
- **입력**: 
  - 현재 Shadcn Registry 블록
- **출력**: 
  - 새로운 코드 블록 (TypeScript/React)
- **설명**: Shadcn 컴포넌트 코드를 코드 블록으로 변환

### 2. Props 타입 추출 (Extract Props Types)
- **입력**: 
  - 현재 Shadcn Registry 블록
- **출력**: 
  - 새로운 코드 블록 (TypeScript)
- **설명**: 컴포넌트 Props를 TypeScript 인터페이스로 추출

## 7. 구현 참조

**향후 구현**

**사용 라이브러리**:
- Shadcn UI 컴포넌트
- `@monaco-editor/react` (코드 편집)

## 8. 특이사항

### Supabase Storage 연동
- 모든 Shadcn 컴포넌트 코드와 의존성을 Supabase Storage에 저장
- URL 기반으로 코드 로드
- 버전 관리 및 업데이트 용이

### iframe 프리뷰
- 격리된 환경에서 컴포넌트 렌더링
- 메인 앱과의 스타일 충돌 방지
- 안전한 실행 환경

### Chrome DevTools 스타일 에디터
- 컴포넌트 요소 선택 UI
- Props 인풋 패널 (정형적 입력)
- 실시간 반영
- 코드 직접 편집 가능

### 블록 내부 상태 관리
- 모드 토글 (프리뷰/코드)는 블록 내부 상태
- Properties에 포함되지 않음
- 블록 렌더링 시에만 사용

### Mount Toolbar vs 블록 내부 메뉴
- **Mount Toolbar**: 블록 선택 시 외부에 표시되는 툴바, 기본 속성 빠른 편집
- **블록 내부 메뉴**: 블록 안에 박혀있는 메뉴 (모드 토글, 복사, 다운로드 등)

## 9. 향후 계획

- [ ] 커스텀 컴포넌트 등록
- [ ] 컴포넌트 버전 관리
- [ ] 테마 프리셋
- [ ] 컴포넌트 조합 (여러 컴포넌트를 하나로)
- [ ] Props 히스토리 (되돌리기/다시하기)
- [ ] 컴포넌트 퍼블리싱 (다른 사용자와 공유)
- [ ] 컴포넌트 변형(Variants) 표시

