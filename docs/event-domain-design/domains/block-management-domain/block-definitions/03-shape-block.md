# 도형 블록 (Shape Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `shape`
- **Enum**: `BlockType.SHAPE`
- **데이터베이스**: `block_type_enum.shape`

### 설명
다양한 기하학적 도형을 제공하는 블록입니다. 사용자가 캔버스 위에 사각형, 원, 삼각형, 화살표 등의 도형을 추가하여 다이어그램이나 플로우차트를 만들 수 있습니다.

### 사용 사례
- 플로우차트 작성
- 다이어그램 구성
- UI 와이어프레임
- 마인드맵
- 시각적 구분선
- 강조 표시

## 2. UI 정의

### 기본 UI
- SVG 기반 도형 렌더링
- 색상 및 테두리 스타일 지원
- 투명도 조절
- 그림자 효과
- 패턴/그라데이션 (향후)

### 기본 크기
```typescript
{
  width: 150,   // 픽셀
  height: 150   // 픽셀
}
```

### 블록 스페이스/에디터
**없음** - Editor Panel에서 속성 편집만 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "도형" 선택
2. 도형 타입 선택 (사각형, 원, 삼각형 등)
3. 캔버스에 도형 블록 생성
4. 속성 조정 (색상, 크기, 테두리 등)

### 붙여넣기 방식
**없음** - 붙여넣기로 생성되지 않음

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface ShapeBlockProperties {
  shapeType: ShapeType;      // 도형 종류
  content?: string;          // 도형 내부 텍스트 (선택 사항)
  color: ColorToken;         // 도형 색상
  borderStyle: BorderStyle;  // 테두리 스타일
}

// 도형 타입 정의
export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  ELLIPSE = 'ellipse',
  TRIANGLE = 'triangle',
  DIAMOND = 'diamond',
  HEXAGON = 'hexagon',
  PENTAGON = 'pentagon',
  STAR = 'star',
  HEART = 'heart',
}

// 테두리 스타일 정의
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
```

### 기본 속성

#### 1. shapeType
- **타입**: `ShapeType`
- **설명**: 도형의 종류
- **기본값**: `ShapeType.RECTANGLE`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '도형 타입',
    inputType: 'select',
    icon: 'Shapes',
    description: '도형의 종류를 선택',
    order: 1,
    options: [
      { value: 'rectangle', label: '사각형' },
      { value: 'circle', label: '원' },
      { value: 'ellipse', label: '타원' },
      { value: 'triangle', label: '삼각형' },
      { value: 'diamond', label: '다이아몬드' },
      { value: 'hexagon', label: '육각형' },
      { value: 'pentagon', label: '오각형' },
      { value: 'star', label: '별' },
      { value: 'heart', label: '하트' },
    ],
  }
  ```

#### 2. content
- **타입**: `string`
- **설명**: 도형 내부 텍스트
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '텍스트',
    inputType: 'textarea',
    icon: 'Type',
    description: '도형 내부에 표시할 텍스트',
    placeholder: '텍스트를 입력하세요...',
    order: 2,
  }
  ```

#### 3. color
- **타입**: `ColorToken`
- **설명**: 도형 색상
- **기본값**: `ColorToken.BLUE`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '색상',
    inputType: 'color',
    icon: 'Palette',
    description: '도형의 색상',
    order: 3,
  }
  ```

#### 4. borderStyle
- **타입**: `'solid' | 'dashed' | 'dotted'`
- **설명**: 테두리 스타일
- **기본값**: `'solid'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '테두리 스타일',
    inputType: 'select',
    icon: 'Minus',
    description: '테두리 스타일',
    order: 4,
    options: [
      { value: 'solid', label: '실선' },
      { value: 'dashed', label: '대시선' },
      { value: 'dotted', label: '점선' },
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
    description: '도형의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['shapeType', 'content', 'color', 'borderStyle'],
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

### 1. ShapeTypeToolbarItem
- **아이콘**: 현재 도형 아이콘
- **기능**: 도형 타입 변경
- **동작**: Popover로 도형 선택 그리드 표시
- **업데이트**: `properties.shapeType`

### 2. ColorToolbarItem
- **아이콘**: 현재 색상 미리보기
- **기능**: 도형 색상 변경
- **동작**: Popover로 색상 팔레트 표시
- **업데이트**: `properties.color`

### 3. BorderStyleToolbarItem
- **아이콘**: `Minus` (선 스타일)
- **기능**: 테두리 스타일 변경
- **동작**: Popover로 스타일 옵션 표시 (실선, 대시선, 점선)
- **업데이트**: `properties.borderStyle`

## 6. 블록 툴

**현재 없음** - 도형 블록은 시각적 요소이므로 특별한 툴이 정의되지 않았습니다.

향후 추가 가능한 툴:
- `SVG 내보내기`: 도형을 SVG 파일로 내보내기
- `이미지 변환`: 도형을 이미지 블록으로 변환
- `그룹화`: 여러 도형을 하나의 그룹 블록으로 결합

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/shape.vo.ts
```
✅ **구현 완료**

**주요 내용**:
- `ShapeBlockProperties` interface (모든 속성 필수값)
- `ShapeBlockPropertiesVO` class
- `createDefault()`: 기본 속성 생성
- `fromJSON()`: JSON에서 VO 생성
- `validate()`: 속성 검증
- `toJSON()`: VO를 JSON으로 변환

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/shape-block.ui-schema.ts
```
✅ **구현 완료**

**주요 내용**:
- `shapeBlockUISchema`: BlockUISchema 정의
- `groups`: 속성 그룹 정의 (기본 정보, 메타데이터)
- `properties`: 각 속성의 UI 정의

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/shape/shape-block.tsx
```
✅ **구현 완료**

**주요 내용**:
- `ShapeBlock`: React 컴포넌트
- `BaseBlock` 사용하여 공통 기능 상속
- SVG 기반 도형 렌더링
- 8가지 도형 지원 (사각형, 원, 타원, 삼각형, 다이아몬드, 육각형, 평행사변형, 원기둥)
- 3가지 테두리 스타일 지원 (실선, 대시선, 점선)

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/
  - shape-type-toolbar-item.tsx
  - border-style-toolbar-item.tsx
  - block-toolbar-mapper.tsx
```
✅ **구현 완료**

**주요 내용** (case 'shape'):
- `ShapeTypeToolbarItem`: 도형 타입 선택
- `ColorToolbarItem`: 색상 선택
- `BorderStyleToolbarItem`: 테두리 스타일 선택

## 8. 특이사항 및 주의사항

### SVG 렌더링
- 모든 도형을 SVG로 렌더링하여 확대/축소 시에도 선명함 유지
- viewBox를 사용한 반응형 크기 조절

### 성능 최적화
- SVG path 캐싱
- 복잡한 도형은 memo 처리
- 많은 도형이 있을 때 가상화 적용

### 접근성
- 도형에 aria-label 추가
- 키보드로 선택 및 이동 가능

### 스타일 토큰 통합
- ColorToken 사용하여 테마 시스템과 통합
- CSS 변수로 색상 관리

## 9. 향후 계획

- [ ] **추가 도형**: 클라우드, 폭발 모양 등 추가
- [ ] **커스텀 도형**: 사용자 정의 SVG path 입력
- [ ] **도형 연결선**: 도형 간 연결선 자동 생성 (플로우차트)
- [ ] **스마트 가이드**: 정렬 및 균등 분포 가이드
- [ ] **그라데이션**: 배경 그라데이션 지원
- [ ] **텍스트 스타일링**: 도형 내부 텍스트 폰트 크기, 정렬 등 스타일 옵션

