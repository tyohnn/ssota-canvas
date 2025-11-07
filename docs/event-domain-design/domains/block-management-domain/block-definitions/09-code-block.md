# 코드 블록 (Code Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `code` (또는 기존 타입 확장)
- **Enum**: 추가 필요
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
코드 스니펫을 신택스 하이라이팅과 함께 표시하는 블록입니다. 다양한 프로그래밍 언어를 지원하며, 코드 실행, 복사, 다운로드 기능을 제공합니다.

### 사용 사례
- 코드 스니펫 저장
- 기술 문서 작성
- 알고리즘 정리
- 코드 리뷰 및 공유

## 2. UI 정의

### 기본 UI
- Monaco Editor로 렌더링
  - 신택스 하이라이팅
  - 줄 번호
  - 언어 뱃지
- 상단 커스텀 버튼
  - 복사 버튼
  - 다운로드 버튼
  - 블록 스페이스 열기 버튼
- 테마 지원 (라이트/다크)

### 기본 크기
```typescript
{
  width: 350,   // 픽셀
  height: 250   // 픽셀 (코드 길이에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**있음** - 전체 화면 코드 에디터
- Monaco Editor (더 큰 화면)
- 자동 완성
- Linting
- 전체 IDE 기능

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "코드" 선택
2. 언어 선택
3. 코드 입력
4. 코드 블록 생성

### 붙여넣기 방식
- **코드 붙여넣기**: 여러 줄의 코드 감지 → 언어 자동 감지 → 코드 블록 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface CodeBlockProperties {
  // 코드 정보
  code: string;                       // 코드 내용
  language: string;                   // 언어 (javascript, python, etc.)
  filename?: string;                  // 파일명
  
  // 테마
  theme: string;                      // 신택스 테마 (vs-dark, github, etc.)
}
```

### 기본 속성

#### 1. code
- **타입**: `string`
- **설명**: 코드 내용
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '코드',
    inputType: 'textarea',
    icon: 'Code',
    description: '코드 내용',
    placeholder: '코드를 입력하세요...',
    order: 1,
  }
  ```

#### 2. language
- **타입**: `string`
- **설명**: 프로그래밍 언어
- **기본값**: `'javascript'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '언어',
    inputType: 'select',
    icon: 'FileCode',
    description: '프로그래밍 언어',
    order: 2,
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'json', label: 'JSON' },
      { value: 'yaml', label: 'YAML' },
      { value: 'sql', label: 'SQL' },
      { value: 'bash', label: 'Bash' },
      // ... 기타 언어
    ],
  }
  ```

#### 3. filename
- **타입**: `string`
- **설명**: 파일명
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '파일명',
    inputType: 'text',
    icon: 'File',
    description: '파일명 (예: app.ts)',
    placeholder: 'filename.ext',
    order: 3,
  }
  ```

#### 4. theme
- **타입**: `string`
- **설명**: 신택스 하이라이팅 테마
- **기본값**: `'vs-dark'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '테마',
    inputType: 'select',
    icon: 'Palette',
    description: '코드 에디터 테마',
    order: 4,
    options: [
      { value: 'vs-dark', label: 'VS Dark' },
      { value: 'vs-light', label: 'VS Light' },
      { value: 'hc-black', label: 'High Contrast Black' },
      { value: 'github-dark', label: 'GitHub Dark' },
      { value: 'github-light', label: 'GitHub Light' },
    ],
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
    description: '코드 블록의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['code', 'language', 'filename', 'theme'],
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

### 1. LanguageToolbarItem
- **아이콘**: `FileCode`
- **기능**: 언어 선택
- **동작**: Popover로 언어 목록 표시
- **업데이트**: `properties.language`

### 2. ThemeToolbarItem
- **아이콘**: `Palette`
- **기능**: 테마 선택
- **동작**: Popover로 테마 목록 표시
- **업데이트**: `properties.theme`

### 3. CopyCodeToolbarItem
- **아이콘**: `Copy`
- **기능**: 코드 복사
- **동작**: 클립보드에 코드 복사

### 4. DownloadCodeToolbarItem
- **아이콘**: `Download`
- **기능**: 코드 다운로드
- **동작**: 파일로 다운로드 (filename 사용)

### 5. OpenBlockSpaceToolbarItem
- **아이콘**: `Maximize2`
- **기능**: 블록 스페이스 열기
- **동작**: 전체 화면 Monaco Editor 열기

## 6. 블록 툴

### 1. 코드 작성 (AI Code Generation)
- **입력**: 
  - 프롬프트 (string)
  - 언어 선택
- **출력**: 
  - 새로운 코드 블록 (생성된 코드)
- **설명**: AI를 사용하여 프롬프트 기반 코드 생성
- **API**: OpenAI API (GPT-4), Anthropic API (Claude)

### 2. 코드 포맷팅 (Format Code)
- **입력**: 
  - 현재 코드 블록
- **출력**: 
  - 업데이트된 코드 블록 (포맷팅된 코드)
- **설명**: Prettier, ESLint 등으로 코드 자동 포맷팅
- **API**: Prettier API, language-specific formatters

### 3. 코드 설명 (Explain Code)
- **입력**: 
  - 현재 코드 블록
- **출력**: 
  - 새로운 마크다운 블록 (코드 설명)
- **설명**: AI를 사용하여 코드 동작 설명 생성
- **API**: OpenAI API (GPT-4), Anthropic API (Claude)

### 4. 코드 최적화 (Optimize Code)
- **입력**: 
  - 현재 코드 블록
- **출력**: 
  - 새로운 코드 블록 (최적화된 코드)
- **설명**: AI를 사용하여 코드 성능 최적화 및 리팩토링
- **API**: OpenAI API (GPT-4), Anthropic API (Claude)

## 7. 구현 참조

**향후 구현**

**사용 라이브러리**:
- `@monaco-editor/react` (Monaco Editor)

## 8. 특이사항

### 언어 감지
- `highlight.js` 자동 감지 기능

### 코드 실행
- Sandpack (CodeSandbox) 통합 (React, Vue 등)
- Pyodide (Python 브라우저 실행)

## 9. 향후 계획

- [ ] 코드 실행 기능
- [ ] Diff 뷰 (코드 비교)
- [ ] 코드 버전 관리

