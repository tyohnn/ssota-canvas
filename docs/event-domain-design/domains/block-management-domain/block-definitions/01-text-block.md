# 텍스트 블록 (Text Block)

> 🎯 **참조 기준 블록**: 이 블록은 가장 완벽하게 구현된 블록 타입으로, 다른 블록 구현 시 참조 기준으로 사용됩니다.

## 1. 블록 개요

### 블록 타입
- **Type**: `text`
- **Enum**: `BlockType.TEXT`
- **데이터베이스**: `block_type_enum.text`

### 설명
스티커나 메모 느낌의 일반 텍스트 블록입니다. 사용자가 캔버스 위에 간단한 메모나 짧은 텍스트를 작성할 수 있습니다. 향후 마크다운 블록과 통합될 수 있으며, 스티커 형태로 변경될 예정입니다.

### 사용 사례
- 간단한 메모 작성
- 아이디어 스티커
- 짧은 텍스트 라벨
- 시각적 주석

## 2. UI 정의

### 기본 UI
- 스티커/메모 스타일의 텍스트 컨테이너
- 텍스트 편집을 위한 더블클릭 모드
- 선택 시 툴바 표시
- 리사이즈 핸들 (BaseBlock 제공)

### 기본 크기
```typescript
{
  width: 200,  // 픽셀
  height: 100  // 픽셀 (콘텐츠에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**없음** - Editor Panel에서 속성 편집만 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "텍스트" 선택
2. 캔버스에 Shadow Block 생성
3. 클릭하여 텍스트 입력 시작
4. 내용 입력 후 완성된 블록으로 전환

### 붙여넣기 방식
현재 지원하지 않음 (향후 일반 텍스트 붙여넣기 지원 가능)

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface TextBlockProperties {
  content: string;       // 텍스트 내용
  color: ColorToken;     // 텍스트 색상
  richStyle: boolean;    // 리치 스타일 활성화
  textAlign: TextAlign;  // 텍스트 정렬
  fontSize: FontSize;    // 폰트 크기
}
```

### 기본 속성

#### 1. content
- **타입**: `string`
- **설명**: 텍스트 블록의 실제 내용
- **기본값**: `''` (빈 문자열)
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '내용',
    inputType: 'textarea',
    icon: 'FileText',
    description: '텍스트 블록의 내용',
    placeholder: '내용을 입력하세요',
    order: 1,
  }
  ```

#### 2. color
- **타입**: `ColorToken`
- **설명**: 텍스트의 색상 토큰
- **기본값**: `ColorToken.GRAY`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '텍스트 색상',
    inputType: 'color',
    icon: 'Palette',
    description: '텍스트의 색상',
    order: 2,
  }
  ```
- **사용 가능한 값**: `ColorToken` enum (GRAY, RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE, PINK, ...)

#### 3. textAlign
- **타입**: `TextAlign`
- **설명**: 텍스트 정렬 방향
- **기본값**: `TextAlign.LEFT`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '텍스트 정렬',
    inputType: 'select',
    icon: 'AlignLeft',
    description: '텍스트 정렬 방향',
    order: 3,
    options: [
      { value: 'left', label: '왼쪽' },
      { value: 'center', label: '가운데' },
      { value: 'right', label: '오른쪽' },
    ],
  }
  ```

#### 4. fontSize
- **타입**: `FontSize`
- **설명**: 텍스트 크기
- **기본값**: `FontSize.MEDIUM`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '폰트 크기',
    inputType: 'select',
    icon: 'Type',
    description: '텍스트 크기',
    order: 4,
    options: [
      { value: '14px', label: '작게 (14px)' },
      { value: '16px', label: '보통 (16px)' },
      { value: '20px', label: '크게 (20px)' },
      { value: '24px', label: '매우 크게 (24px)' },
    ],
  }
  ```

#### 5. richStyle
- **타입**: `boolean`
- **설명**: 리치 텍스트 스타일 활성화 여부
- **기본값**: `false`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '리치 스타일',
    inputType: 'checkbox',
    icon: 'Bold',
    description: '리치 텍스트 스타일 활성화',
    order: 5,
  }
  ```

### 메타데이터 속성 (공통)

#### createdAt
- **타입**: `string` (ISO 8601)
- **설명**: 블록 생성 일시
- **기본값**: 서버에서 자동 설정
- **필수**: ✅ Yes (자동)
- **UI Schema**:
  ```typescript
  {
    label: '생성일',
    inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
      order: 6,
      readonly: true,
    defaultDisplay: (value: any) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  }
  ```

#### updatedAt
- **타입**: `string` (ISO 8601)
- **설명**: 블록 마지막 수정 일시
- **기본값**: 서버에서 자동 업데이트
- **필수**: ✅ Yes (자동)
- **UI Schema**:
  ```typescript
  {
    label: '수정일',
    inputType: 'readonly-datetime',
      icon: 'Clock',
      description: '블록이 마지막으로 수정된 날짜',
      order: 7,
      readonly: true,
    defaultDisplay: (value: any) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  }
  ```

#### createdBy
- **타입**: `UserProfile`
- **설명**: 블록을 생성한 사용자
- **기본값**: 현재 사용자
- **필수**: ✅ Yes (자동)
- **UI Schema**:
  ```typescript
  {
    label: '작성자',
    inputType: 'readonly-profile',
      icon: 'User',
      description: '블록을 생성한 사용자',
      order: 8,
      readonly: true,
    defaultDisplay: (value: any) => {
      if (!value) return '알 수 없음';
      if (typeof value === 'string') return value;
      return value.name || value.email || '알 수 없음';
    },
  }
  ```

### 속성 그룹 (UI Schema Groups)

```typescript
groups: [
  {
    id: 'basic-info',
    label: '기본 정보',
    description: '블록의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['content', 'title'],
  },
  {
    id: 'style',
    label: '스타일',
    description: '텍스트 스타일 설정',
    defaultCollapsed: true,
    order: 2,
    properties: ['color', 'textAlign', 'fontSize', 'richStyle'],
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

블록 선택 시 표시되는 빠른 편집 툴바:

### 1. ColorToolbarItem
- **아이콘**: 현재 색상 미리보기
- **기능**: 텍스트 색상 변경
- **동작**: Popover로 색상 팔레트 표시
- **업데이트**: `properties.color`

### 2. FontSizeToolbarItem
- **아이콘**: `ALargeSmall`
- **기능**: 폰트 크기 변경
- **동작**: Popover로 크기 옵션 표시 (S, M, L, XL)
- **업데이트**: `properties.fontSize`

### 3. TextAlignToolbarItem
- **아이콘**: `AlignLeft` / `AlignCenter` / `AlignRight`
- **기능**: 텍스트 정렬 변경
- **동작**: Popover로 정렬 옵션 표시
- **업데이트**: `properties.textAlign`

### 4. RichStyleToolbarItem
- **아이콘**: `Palette`
- **기능**: 리치 스타일 토글
- **동작**: 버튼 클릭으로 토글
- **업데이트**: `properties.richStyle`

## 6. 블록 툴

**현재 없음** - 텍스트 블록은 단순한 콘텐츠 블록이므로 특별한 툴이 정의되지 않았습니다.

향후 추가 가능한 툴:
- `텍스트 요약`: 긴 텍스트를 요약하여 새 텍스트 블록 생성
- `번역`: 다른 언어로 번역하여 새 텍스트 블록 생성
- `마크다운 변환`: 텍스트 블록을 마크다운 블록으로 변환

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/text.vo.ts
```

**주요 내용**:
- `TextBlockProperties` interface
- `TextBlockPropertiesVO` class
- `createDefault()`: 기본 속성 생성
- `fromJSON()`: JSON에서 VO 생성
- `validate()`: 속성 검증
- `toJSON()`: VO를 JSON으로 변환

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/text-block.ui-schema.ts
```

**주요 내용**:
- `textBlockUISchema`: BlockUISchema 정의
- `groups`: 속성 그룹 정의
- `properties`: 각 속성의 UI 정의

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/text/text-block.tsx
```

**주요 내용**:
- `TextBlock`: React 컴포넌트
- `BaseBlock` 사용하여 공통 기능 상속
- 더블클릭 편집 모드
- Debounced 자동 저장
- Textarea 스크롤 핸들링
- Optimistic Update

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```

**주요 내용** (case 'text'):
- `ColorToolbarItem`
- `FontSizeToolbarItem`
- `TextAlignToolbarItem`
- `RichStyleToolbarItem`

### 개별 Toolbar Item 컴포넌트
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/
  - color-toolbar-item.tsx
  - font-size-toolbar-item.tsx
  - text-align-toolbar-item.tsx
  - rich-style-toolbar-item.tsx
```

## 8. 특이사항 및 주의사항

### 편집 모드
- **더블클릭 모드**: 선택된 블록을 한 번 더 클릭하면 편집 모드 진입
- **자동 저장**: 500ms debounce로 자동 저장
- **Blur 저장**: 포커스 벗어나면 즉시 저장
- **ESC 취소**: ESC 키로 편집 취소 (저장하지 않음)
- **Cmd/Ctrl+Enter**: 편집 종료 및 저장

### 스크롤 처리
- Textarea 내부 스크롤을 위해 네이티브 휠 이벤트 전파 차단
- React Flow 캔버스 스크롤과 분리

### 상태 관리
- `isEditing`: 편집 중 여부 (SSOT)
- `draftContent`: 초안 내용 (로컬 상태)
- `isDoubleClickMode`: 더블클릭 모드 활성화 여부
- Canvas Mode Context에 `textareaEditing` 상태 전파

### Optimistic Update
- 즉시 UI 업데이트 (React Flow 노드)
- 서버 동기화는 비동기로 처리
- 실패 시 에러 로깅 (롤백은 미구현)

## 9. 향후 계획

- [ ] **마크다운 블록과 통합**: 일반 텍스트와 마크다운을 하나의 블록으로 통합
- [ ] **스티커 스타일**: UI를 더 스티커처럼 개선
- [ ] **리치 텍스트 에디터**: richStyle 활성화 시 실제 리치 텍스트 에디터 제공
- [ ] **텍스트 포맷팅**: 볼드, 이탤릭, 밑줄 등 기본 포맷팅 지원
- [ ] **AI 툴 추가**: 요약, 번역, 톤 변경 등

