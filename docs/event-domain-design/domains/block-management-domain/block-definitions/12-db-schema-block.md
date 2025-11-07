# 테이블 블록 (Database Table Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `table` (신규)
- **Enum**: `BlockType.TABLE`
- **데이터베이스**: `block_type_enum.table` 추가 필요

### 설명
데이터베이스 테이블을 표현하는 블록입니다. 단일 테이블의 구조(컬럼, 타입, 제약조건)를 시각화합니다. 
테이블 간의 관계는 React Flow의 edge(연결선)로 표현됩니다.

### 사용 사례
- 데이터베이스 설계 문서화
- 테이블 구조 시각화
- ERD 작성 (여러 테이블 블록 + edge로 구성)
- 스키마 리뷰 및 공유
- 데이터 모델링

## 2. UI 정의

### 기본 UI
- 테이블 카드 스타일
  - 헤더: 테이블명 + 아이콘
  - 컬럼 목록
    - 컬럼명
    - 데이터 타입
    - Primary Key (🔑 아이콘)
    - Foreign Key (🔗 아이콘)
    - Nullable/Required 표시
  - 인덱스 표시 (선택 사항)
- React Flow Handle (연결점)
  - 좌우 또는 상하에 연결점 표시
  - 다른 테이블과 edge로 연결

### 기본 크기
```typescript
{
  width: 300,   // 픽셀
  height: 250   // 픽셀 (컬럼 수에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**있음** - 테이블 에디터 제공
- 테이블명 수정
- 컬럼 추가/편집/삭제
- 인덱스 설정
- 제약조건 설정
- SQL DDL 미리보기/생성

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "Table" 선택
2. 테이블명 입력
3. 블록 생성 (기본 컬럼 포함)
4. 블록 스페이스에서 컬럼 추가/수정

### 붙여넣기 방식
- **SQL DDL**: CREATE TABLE 문 감지 → 테이블 블록 생성 (단일 테이블만)
- **여러 테이블**: 각 테이블마다 별도의 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface TableBlockProperties {
  // 테이블 정보
  tableName: string;                    // 테이블명
  columns: Column[];                     // 컬럼 목록
  
  // 표시 옵션
  showIndexes: boolean;                 // 인덱스 표시
  showTypes: boolean;                   // 데이터 타입 표시
  showConstraints: boolean;             // 제약조건 표시
  
  // 데이터베이스 타입
  dbType: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'other';
  
  // 테마
  color: ColorToken;                    // 테이블 색상
}

export interface Column {
  id: string;                           // 컬럼 ID (UUID)
  name: string;                         // 컬럼명
  type: string;                         // 데이터 타입 (VARCHAR, INT, TIMESTAMP 등)
  nullable: boolean;                    // NULL 허용 여부
  defaultValue?: string;                // 기본값
  isPrimary: boolean;                   // Primary Key 여부
  isForeign: boolean;                   // Foreign Key 여부
  isUnique: boolean;                    // Unique 제약조건
  isIndex: boolean;                     // 인덱스 여부
  comment?: string;                     // 컬럼 설명
}

// Note: 테이블 간의 관계(Relationship)는 Properties에 포함되지 않습니다.
// 관계는 React Flow의 edge로 표현되며, 캔버스 레벨에서 관리됩니다.
```

### 기본 속성

#### 1. tableName
- **타입**: `string`
- **설명**: 테이블명
- **기본값**: `'new_table'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '테이블명',
    inputType: 'text',
    icon: 'Table',
    description: '데이터베이스 테이블 이름',
    placeholder: 'users',
    order: 1,
  }
  ```

#### 2. columns
- **타입**: `Column[]`
- **설명**: 컬럼 목록
- **기본값**: `[]`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '컬럼',
    inputType: 'custom',  // 블록 스페이스에서 편집
    icon: 'List',
    description: '테이블 컬럼 목록',
    order: 2,
  }
  ```

#### 3. showIndexes, showTypes, showConstraints
- **타입**: `boolean`
- **설명**: 표시 옵션
- **기본값**: `true`
- **필수**: ✅ Yes

#### 4. dbType
- **타입**: `'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'other'`
- **설명**: 데이터베이스 타입
- **기본값**: `'postgresql'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: 'DB 타입',
    inputType: 'select',
    icon: 'Database',
    description: '데이터베이스 종류',
    order: 3,
    options: [
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'mongodb', label: 'MongoDB' },
      { value: 'other', label: 'Other' },
    ],
  }
  ```

#### 5. color
- **타입**: `ColorToken`
- **설명**: 테이블 색상
- **기본값**: `ColorToken.BLUE_500`
- **필수**: ✅ Yes
- **UI Schema**: (텍스트 블록과 동일)

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
    description: '테이블 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['tableName', 'dbType', 'color'],
  },
  {
    id: 'columns',
    label: '컬럼',
    description: '테이블 컬럼 목록',
    defaultCollapsed: false,
    order: 2,
    properties: ['columns'],
  },
  {
    id: 'display',
    label: '표시 옵션',
    description: '블록 표시 설정',
    defaultCollapsed: true,
    order: 3,
    properties: ['showIndexes', 'showTypes', 'showConstraints'],
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

## 5. 툴바 아이템

### 1. AddColumnToolbarItem
- **아이콘**: `Plus`
- **기능**: 컬럼 추가
- **동작**: 블록 스페이스 열기 (컬럼 추가 모드)

### 2. ExportSQLToolbarItem
- **아이콘**: `Download`
- **기능**: SQL DDL 내보내기
- **동작**: CREATE TABLE 문 생성 및 다운로드

### 3. ColorToolbarItem
- **아이콘**: `Palette`
- **기능**: 테이블 색상 변경
- **동작**: 색상 선택 Popover 표시

### 4. OpenBlockSpaceToolbarItem
- **아이콘**: `Maximize2`
- **기능**: 블록 스페이스 열기
- **동작**: 전체 화면 테이블 에디터 열기

## 6. 블록 툴

### 1. SQL DDL 생성 (Generate SQL DDL)
- **입력**: 
  - 현재 테이블 블록
- **출력**: 
  - 새로운 코드 블록 (SQL DDL)
- **설명**: 테이블 구조를 기반으로 CREATE TABLE 문 생성

### 2. TypeScript 타입 생성 (Generate TypeScript Types)
- **입력**: 
  - 현재 테이블 블록
- **출력**: 
  - 새로운 코드 블록 (TypeScript)
- **설명**: 테이블 구조를 TypeScript 인터페이스로 변환

### 3. Prisma Schema 생성 (Generate Prisma Schema)
- **입력**: 
  - 현재 테이블 블록
- **출력**: 
  - 새로운 코드 블록 (Prisma)
- **설명**: 테이블 구조를 Prisma Schema로 변환

### 4. Drizzle ORM Schema 생성 (Generate Drizzle Schema)
- **입력**: 
  - 현재 테이블 블록
- **출력**: 
  - 새로운 코드 블록 (TypeScript)
- **설명**: 테이블 구조를 Drizzle ORM Schema로 변환

## 7. 구현 참조

**향후 구현**

**사용 라이브러리**:
- `sql-ddl-to-json-schema` (SQL 파싱)
- `@tanstack/react-table` (컬럼 목록 렌더링, 선택 사항)

## 8. 특이사항

### React Flow 통합
- 테이블 블록은 React Flow의 커스텀 노드로 구현
- React Flow Handle을 사용하여 다른 테이블과 연결
- Edge(연결선)로 테이블 간 관계 표현 (1:1, 1:N, N:M)
- Edge의 label로 관계 타입 표시

### SQL 파싱
- DDL 문을 파싱하여 테이블 구조 추출
- 여러 테이블이 포함된 DDL은 각각 별도의 블록으로 생성
- 다양한 DB 문법 지원

### 컬럼 편집
- 블록 스페이스에서 인라인 편집
- 드래그 앤 드롭으로 컬럼 순서 변경
- Primary Key, Foreign Key 설정

## 9. 향후 계획

- [ ] 실제 DB 연결하여 스키마 임포트
- [ ] Edge로 Foreign Key 관계 자동 생성
- [ ] 관계 타입 설정 UI (1:1, 1:N, N:M)
- [ ] 마이그레이션 생성
- [ ] 스키마 버전 관리
- [ ] 데이터 샘플 표시
- [ ] ERD 전체를 이미지로 내보내기

