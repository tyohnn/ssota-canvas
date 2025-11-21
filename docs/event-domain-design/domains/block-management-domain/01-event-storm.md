# Event Storming: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자 (Canvas Management 연동)  
**작성일**: 2025-10-19  
**최종 업데이트**: 2025-10-22
**버전**: v2.0

**목적**: Canvas Management Domain 구현을 위한 Block Management Domain 설계 (속성 시스템 포함)
**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 범용 블록 시스템을 통한 재사용 가능한 콘텐츠 관리, 유연한 속성 시스템을 통한 구조화된 데이터 관리, Canvas Management Domain과의 협력을 통한 캔버스 내 블록 조작 지원

## 📝 핵심 개념 정리

### Block Core Concepts
```
Block System
├── Block Definition (블록 정의)
│   ├── Block Type (유튜브, 파이썬, 마크다운, 도형, 링크, 지도, 코드 등)
│   ├── Default Properties (블록 타입별 기본 속성)
│   ├── Custom Properties (사용자 정의 속성)
│   └── Workspace Scope (워크스페이스별 고유성)
├── Block Properties System (속성 시스템)
│   ├── Property Types (텍스트형, 선택형, 날짜형, 미디어형, 프로필형)
│   ├── Property Configuration (옵션, 색상, 가시성, 순서)
│   └── Property Values (타입별 값 저장 및 검증)
├── Block Tools System (툴 시스템)
│   ├── Type-specific Tools (블록 타입별 특화 기능)
│   ├── User Execution (사용자 직접 실행)
│   └── AI Tool Calls (AI 에이전트 호출)
└── Block Lifecycle
    ├── 생성 (타입별 기본 속성 초기화) → 검증 → 저장
    ├── 조회 → 변환 → 업데이트 (속성 포함)
    └── 복제 → 마운트 → 삭제
```

### Property Types Definition
```typescript
// 속성 타입 체계
Property Types:
├── Text-based (텍스트형)
│   ├── text (일반 텍스트)
│   ├── url (URL)
│   ├── email (이메일)
│   └── phone (전화번호)
├── Select-based (선택형)
│   ├── select (단일 선택)
│   ├── multi-select (다중 선택)
│   └── status (상태 - 그룹화된 선택)
├── Date-based (날짜형)
│   ├── date (날짜만)
│   ├── date + time (날짜 + 시간)
│   ├── date range (시작일 ~ 종료일)
│   └── date range + time (시작/종료 + 시간)
├── Media-based (미디어형)
│   ├── image (이미지 - Supabase Storage)
│   └── file (첨부파일 - Supabase Storage)
└── Profile-based (프로필형)
    ├── profile (워크스페이스 멤버)
    └── readonly profiles (작성자 - 자동 설정)
```

### Block Type System
- **정적 정의**: 블록 타입은 코드베이스에 정적으로 정의 (런타임 DB 정의 아님)
- **기본 속성**: 각 블록 타입마다 고유한 기본 속성 (예: 유튜브 블록 → youtubeUrl)
- **커스텀 속성**: 모든 블록 타입에서 자유롭게 추가 가능한 사용자 정의 속성
- **UI 컴포넌트**: 블록 타입마다 전용 렌더링 컴포넌트
- **Block Tools**: 블록 타입별 특화 기능 (예: 유튜브 댓글 가져오기, 파이썬 실행 등)

### Properties Storage Strategy (MVP) - 개선안
```typescript
// blocks 테이블 - JSONB 기반 (정의와 값 분리)
{
  id: uuid,
  block_type: 'youtube' | 'python' | 'markdown' | ...,
  workspace_id: uuid,
  
  // ✅ 값만 저장 (간단한 key-value)
  properties: { // JSONB 컬럼
    // 기본 속성 값
    youtubeUrl: "https://youtube.com/...",
    
    // 커스텀 속성 값 (property id를 key로 사용)
    "prop-1": "중요한 영상",
    "prop-2": "opt-1",
    "prop-3": "user-id-123",
    "prop-4": "user-id-456"
  },
  
  // ✅ 커스텀 속성 정의만 저장
  custom_properties: [ // JSONB 배열
    {
      id: "prop-1",
      name: "메모",
      type: "text",
      order: 0,
      visible: true
    },
    {
      id: "prop-2",
      name: "카테고리",
      type: "select",
      options: [
        { id: "opt-1", label: "교육", color: "blue" }
      ],
      order: 1,
      visible: true
    },
    {
      id: "prop-3",
      name: "담당자",
      type: "profile",
      order: 2,
      visible: true
    },
    {
      id: "prop-4",
      name: "작성자",
      type: "profile",
      readonly: true,
      order: 3,
      visible: true
    }
  ],
  
  created_at: timestamptz,
  updated_at: timestamptz,
  deleted_at: timestamptz
}
```

**정의와 값 분리 전략 선택 이유**:
- ✅ Canvas JOIN 성능 최적화 (단일 쿼리, 최소 데이터 전송)
- ✅ RLS 정책 단순화 (blocks 테이블만 관리)
- ✅ 원자적 업데이트 보장 (트랜잭션 복잡도 최소화)
- ✅ **컴포넌트화 대응 완벽** (custom_properties만 컴포넌트로 이동)
- ✅ **선택적 파싱** (값만/정의만 필요할 때 각각 파싱)
- ✅ **데이터 구조 명확성** (값과 정의의 역할 분리)
- ✅ MVP 개발 속도 향상

**컴포넌트화 마이그레이션 경로** (Post-MVP):
```typescript
// 현재 (MVP): 독립 블록
blocks {
  properties: { [key]: value },
  custom_properties: [ /* 정의 */ ]
}

// 미래 (Post-MVP): 컴포넌트 + 인스턴스
block_components {
  custom_properties: [ /* 정의 */ ]  // ← blocks에서 이동
}

blocks {
  component_id: uuid,
  properties: { [key]: value }  // ← 그대로 유지
}
```

### Domain Scope/Boundary
- **Block**: 범용 블록 엔티티 관리 (생성, 조회, 업데이트, 삭제)
- **Block Type**: 블록 타입별 기본 속성 및 UI 컴포넌트 매핑
- **Block Properties**: 커스텀 속성 시스템 (정의, 값, 옵션, 순서, 가시성)
- **Block Tools**: 블록 타입별 특화 기능 실행 (사용자/AI)
- **Block Workspace**: 워크스페이스별 블록 스코프 및 권한 관리

### Business Rules/Policies
- **Block Uniqueness**: 워크스페이스 내 slug 유일성 보장
- **Block Type Validation**: 지원되는 블록 타입만 생성 허용
- **Property Type Validation**: 속성 타입별 값 스키마 검증
- **Property Type Change**: 속성 타입 변경 시 기존 값 보존 (렌더링 시 호환성 검사)
- **Readonly Properties**: 작성자, 생성시각, 편집시각은 시스템 자동 관리
- **Workspace Isolation**: 워크스페이스 간 블록 격리 및 접근 제어
- **Media Storage**: 이미지/파일은 Supabase Storage 사용
- **Profile Property**: 워크스페이스 멤버만 참조 가능
- **Tool Execution**: 툴 실행 결과는 새 블록 생성 (엣지로 연결)

---

## 🟠 Domain Events (시간 순서)

### Block Creation & Management
- 블록이 타입별 기본 속성과 함께 생성되었다 (Block Created with Type Default Properties)
  - *생성자 정보(createdBy), 생성 시간(createdAt), 수정 시간(updatedAt) 포함*
- 블록이 검증되었다 (Block Validated)
- 블록 타입 기본 속성이 설정되었다 (Block Type Default Property Set)
- 블록 타입 기본 속성이 업데이트되었다 (Block Type Default Property Updated)

### Block Modification
- 블록 정보가 업데이트되었다 (Block Updated)
- 블록 메타데이터가 변경되었다 (Block Metadata Changed)
- 블록 슬러그가 변경되었다 (Block Slug Changed)

### Block Deletion & Cleanup
- 블록이 소프트 삭제되었다 (Block Soft Deleted)
- 블록 관련 데이터가 정리되었다 (Block Data Cleaned)
- 블록이 완전히 삭제되었다 (Block Permanently Deleted)

---

### Custom Property Lifecycle
- 커스텀 속성이 추가되었다 (Custom Property Added)
- 커스텀 속성이 복제되었다 (Custom Property Duplicated)
- 커스텀 속성 이름이 변경되었다 (Custom Property Name Changed)
- 커스텀 속성 타입이 변경되었다 (Custom Property Type Changed)
- 커스텀 속성 순서가 변경되었다 (Custom Property Order Changed)
- 커스텀 속성 가시성이 변경되었다 (Custom Property Visibility Changed)
- 커스텀 속성이 삭제되었다 (Custom Property Deleted)

### Property Value Management
- 속성 값이 설정되었다 (Property Value Set)
- 속성 값이 업데이트되었다 (Property Value Updated)
- 속성 값이 삭제되었다 (Property Value Cleared)
- 속성 값이 검증되었다 (Property Value Validated)

### Select-Type Property Options
- 선택형 옵션이 추가되었다 (Select Option Added)
- 선택형 옵션이 복제되었다 (Select Option Duplicated)
- 선택형 옵션 라벨이 수정되었다 (Select Option Label Updated)
- 선택형 옵션 색상이 변경되었다 (Select Option Color Changed)
- 선택형 옵션 순서가 변경되었다 (Select Option Order Changed)
- 선택형 옵션이 삭제되었다 (Select Option Deleted)

### Status-Type Property Management
- 상태 그룹 옵션이 추가되었다 (Status Group Option Added)
  - 진행전 / 진행중 / 완료 그룹별 옵션
- 상태 그룹 옵션이 복제되었다 (Status Group Option Duplicated)
- 상태 그룹 옵션이 다른 그룹으로 이동되었다 (Status Group Option Moved)
- 상태 그룹 옵션 라벨이 수정되었다 (Status Group Option Label Updated)
- 상태 그룹 옵션 색상이 변경되었다 (Status Group Option Color Changed)
- 상태 그룹 옵션이 삭제되었다 (Status Group Option Deleted)

### Date-Type Property Configuration
- 날짜 속성 시간 옵션이 활성화되었다 (Date Property Time Enabled)
- 날짜 속성 시간 옵션이 비활성화되었다 (Date Property Time Disabled)
- 날짜 속성 종료일 옵션이 활성화되었다 (Date Property End Date Enabled)
- 날짜 속성 종료일 옵션이 비활성화되었다 (Date Property End Date Disabled)
- 날짜 시작일이 설정되었다 (Date Start Set)
- 날짜 종료일이 설정되었다 (Date End Set)
- 날짜 시간이 설정되었다 (Date Time Set)
- 날짜 값이 삭제되었다 (Date Value Cleared)

### Media-Type Property Management
- 이미지가 Supabase Storage에 업로드되었다 (Image Uploaded to Storage)
- 이미지 업로드가 실패했다 (Image Upload Failed)
- 첨부파일이 Supabase Storage에 업로드되었다 (File Uploaded to Storage)
- 첨부파일 업로드가 실패했다 (File Upload Failed)
- 미디어가 Storage에서 삭제되었다 (Media Deleted from Storage)
- 미디어 URL이 생성되었다 (Media Public URL Generated)

### Profile-Type Property Management
- 프로필 속성이 추가되었다 (Profile Property Added)
- 프로필 값이 설정되었다 (Profile Value Set)
- 프로필 값이 변경되었다 (Profile Value Changed)
- 워크스페이스 멤버가 검증되었다 (Workspace Member Validated)
- 프로필 값이 삭제되었다 (Profile Value Cleared)

### Readonly Property Management
- 작성자 속성이 자동 설정되었다 (Author Property Auto-Set)
- 생성시각 속성이 자동 설정되었다 (Created Time Property Auto-Set)
- 편집시각 속성이 자동 업데이트되었다 (Edited Time Property Auto-Updated)
- Readonly 속성이 추가되었다 (Readonly Property Added)
- Readonly 속성이 삭제되었다 (Readonly Property Deleted)

---

### Block Tool Execution
- 블록 툴이 사용자에 의해 실행되었다 (Block Tool Executed by User)
- 블록 툴이 AI에 의해 호출되었다 (Block Tool Called by AI)
- 블록 툴 실행이 시작되었다 (Block Tool Execution Started)
- 블록 툴 실행이 완료되었다 (Block Tool Execution Completed)
- 블록 툴 실행이 실패했다 (Block Tool Execution Failed)
- 블록 툴 실행 결과가 파싱되었다 (Block Tool Result Parsed)
- 툴 실행 결과로 새 블록들이 생성되었다 (New Blocks Created from Tool Result)
- 툴 실행 결과가 엣지로 연결되었다 (Tool Result Connected via Edges)

---

## 🔵 Commands & Actors

### 주요 커맨드 목록

#### Scenario 1: Block Lifecycle Management
- **Canvas Management가 블록 생성 요청하기** (Canvas Management) → [Block Created with Type Default Properties]
- **시스템이 타입별 기본 속성 초기화하기** (System) → [Block Type Default Property Set]
- **시스템이 블록 검증하기** (System) → [Block Validated]
- **Canvas Management가 블록 기본 속성 업데이트 요청하기** (Canvas Management) → [Block Type Default Property Updated]
- **Canvas Management가 블록 정보 업데이트 요청하기** (Canvas Management) → [Block Updated]
- **Canvas Management가 블록 삭제 요청하기** (Canvas Management) → [Block Soft Deleted]

#### Scenario 2: Custom Property Management
- **사용자가 커스텀 속성 추가하기** (User) → [Custom Property Added]
- **사용자가 속성 타입 선택하기** (User) → [Property Type Set]
- **사용자가 속성 이름 입력하기** (User) → [Custom Property Name Changed]
- **사용자가 속성 값 입력하기** (User) → [Property Value Set]
- **사용자가 속성 가시성 토글하기** (User) → [Custom Property Visibility Changed]
- **사용자가 속성 순서 변경하기** (User) → [Custom Property Order Changed]
- **사용자가 속성 타입 변경하기** (User) → [Custom Property Type Changed]
- **시스템이 속성 값 검증하기** (System) → [Property Value Validated]
- **사용자가 속성 복제하기** (User) → [Custom Property Duplicated]
- **사용자가 속성 삭제하기** (User) → [Custom Property Deleted]

#### Scenario 3: Select-Type Property Configuration
- **사용자가 선택형 속성 옵션 추가하기** (User) → [Select Option Added]
- **사용자가 옵션 라벨 입력하기** (User) → [Select Option Label Updated]
- **사용자가 옵션 색상 선택하기** (User) → [Select Option Color Changed]
- **사용자가 옵션 순서 변경하기** (User) → [Select Option Order Changed]
- **사용자가 옵션 복제하기** (User) → [Select Option Duplicated]
- **사용자가 옵션 삭제하기** (User) → [Select Option Deleted]

#### Scenario 4: Status-Type Property Configuration
- **사용자가 상태 속성 생성하기** (User) → [Status Property Added with Default Groups]
  - 시스템이 기본 그룹 생성 (진행전/진행중/완료)
- **사용자가 상태 그룹에 옵션 추가하기** (User) → [Status Group Option Added]
- **사용자가 옵션을 다른 그룹으로 이동하기** (User) → [Status Group Option Moved]
- **사용자가 상태 옵션 라벨 수정하기** (User) → [Status Group Option Label Updated]
- **사용자가 상태 옵션 색상 변경하기** (User) → [Status Group Option Color Changed]
- **사용자가 상태 옵션 복제하기** (User) → [Status Group Option Duplicated]
- **사용자가 상태 옵션 삭제하기** (User) → [Status Group Option Deleted]

#### Scenario 5: Date-Type Property Configuration
- **사용자가 날짜 속성 생성하기** (User) → [Date Property Added]
- **사용자가 시간 옵션 활성화하기** (User) → [Date Property Time Enabled]
- **사용자가 종료일 옵션 활성화하기** (User) → [Date Property End Date Enabled]
- **사용자가 시작일 선택하기** (User) → [Date Start Set]
- **사용자가 종료일 선택하기** (User) → [Date End Set]
- **사용자가 시간 설정하기** (User) → [Date Time Set]
- **사용자가 날짜 값 삭제하기** (User) → [Date Value Cleared]

#### Scenario 6: Media-Type Property Management
- **사용자가 이미지 업로드하기** (User) → [Image Uploaded to Storage]
- **시스템이 Supabase Storage에 저장하기** (System) → [Media Stored]
- **시스템이 Public URL 생성하기** (System) → [Media Public URL Generated]
- **사용자가 첨부파일 업로드하기** (User) → [File Uploaded to Storage]
- **사용자가 미디어 삭제하기** (User) → [Media Deleted from Storage]

#### Scenario 7: Profile-Type Property Management
- **사용자가 프로필 속성 추가하기** (User) → [Profile Property Added]
- **사용자가 워크스페이스 멤버 선택하기** (User) → [Profile Value Set]
- **시스템이 워크스페이스 멤버 검증하기** (System) → [Workspace Member Validated]
- **사용자가 프로필 값 변경하기** (User) → [Profile Value Changed]
- **사용자가 프로필 값 삭제하기** (User) → [Profile Value Cleared]

#### Scenario 8: Readonly Property Management
- **사용자가 작성자 속성 추가하기** (User) → [Readonly Property Added]
- **시스템이 현재 사용자를 작성자로 자동 설정하기** (System) → [Author Property Auto-Set]
- **사용자가 생성시각 속성 추가하기** (User) → [Readonly Property Added]
- **시스템이 생성 시각 자동 설정하기** (System) → [Created Time Property Auto-Set]
- **사용자가 편집시각 속성 추가하기** (User) → [Readonly Property Added]
- **시스템이 블록 업데이트 시 편집시각 자동 업데이트하기** (System) → [Edited Time Property Auto-Updated]

#### Scenario 9: Block Tool Execution
- **사용자가 블록 툴 실행하기** (User) → [Block Tool Executed by User]
- **AI가 블록 툴 호출하기** (AI Agent) → [Block Tool Called by AI]
- **시스템이 툴 로직 실행하기** (System) → [Block Tool Execution Started]
- **시스템이 툴 실행 완료하기** (System) → [Block Tool Execution Completed]
- **시스템이 툴 결과 파싱하기** (System) → [Block Tool Result Parsed]
- **시스템이 결과를 새 블록들로 생성하기** (System) → [New Blocks Created from Tool Result]
- **시스템이 결과를 엣지로 연결하기** (System) → [Tool Result Connected via Edges]

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **Content Creator**: 블록 생성, 속성 추가/편집, 툴 실행 담당
- **Canvas User**: 캔버스 내 블록 조작 및 마운트 관리
- **Property Editor**: 블록 속성 설정 및 값 입력 담당
- **Block Tool User**: 블록 툴을 수동으로 실행하는 사용자

#### System Actors (내부 시스템)
- **Block Validation Service**: 블록 데이터 유효성 검증
- **Property Validation Service**: 속성 타입별 값 검증
- **Workspace Isolation Service**: 워크스페이스별 블록 격리 관리
- **Media Upload Service**: Supabase Storage 업로드 처리
- **Block Tool Executor**: 블록 툴 실행 엔진
- **Tool Result Parser**: 툴 실행 결과 파싱 및 블록 생성

#### AI Actors
- **AI Agent**: 블록 툴을 Tool Call 형태로 호출하는 AI
- **AI Assistant**: 사용자와 협력하여 블록 생성 및 편집 지원

#### External Systems (외부 도메인)
- **Canvas Management Domain**: 블록 테이블 직접 조회 (DB JOIN), 엣지 연결 관리
- **Workspace Management Domain**: 워크스페이스 권한 및 스코프 관리 (RLS 정책), 멤버 정보 제공
- **Supabase Storage**: 미디어 파일 저장 및 Public URL 생성
- **Supabase Auth**: 사용자 인증 및 작성자 정보 제공

---

## 🟠 Bounded Context 정의

### Block Management Context (Main Context)
**책임**: 
- 범용 블록 시스템의 생성, 조회, 수정, 삭제
- 유연한 속성 시스템 (Custom Properties) 관리
- 블록 타입별 특화 기능 (Block Tools) 제공
- Canvas Management Domain과의 인터페이스 제공

**핵심 언어**: Block, BlockType, DefaultProperty, CustomProperty, PropertyType, PropertyValue, PropertyOption, BlockTool, Workspace, Validation, SoftDelete

**핵심 용어 및 개념**:
- **Block**: 기본 콘텐츠 단위로, 타입별 기본 속성과 커스텀 속성을 포함
- **BlockType**: 블록의 종류 (youtube, python, markdown, shape, link, map, latex, code 등)
- **DefaultProperty**: 블록 타입별로 정적으로 정의된 필수 속성 (예: youtubeUrl)
- **CustomProperty**: 사용자가 자유롭게 추가/편집할 수 있는 속성
- **PropertyType**: 속성의 데이터 타입 (text, url, email, phone, select, multi-select, status, date, image, file, profile)
- **PropertyValue**: 각 속성에 저장된 실제 값
- **PropertyOption**: 선택형/상태형 속성의 선택지 (label, color, order)
- **StatusGroup**: 상태형 속성의 그룹 분류 (진행전/진행중/완료)
- **DateConfig**: 날짜형 속성의 옵션 설정 (시간 포함 여부, 종료일 포함 여부)
- **MediaUpload**: 이미지/파일을 Supabase Storage에 업로드
- **ProfileReference**: 워크스페이스 멤버를 참조하는 속성
- **ReadonlyProperty**: 시스템이 자동 관리하는 속성 (작성자, 생성시각, 편집시각)
- **BlockTool**: 블록 타입별 특화 기능 (코드베이스에 정적으로 정의)
- **ToolExecution**: 사용자 또는 AI가 블록 툴을 실행
- **Workspace**: 블록의 스코프 및 접근 권한 경계
- **Validation**: 블록 및 속성 데이터 유효성 검증
- **SoftDelete**: deleted_at 타임스탬프 기반 소프트 삭제

**포함 이벤트**:
- Block Creation & Management (4개 이벤트)
- Block Modification (3개 이벤트)
- Block Deletion & Cleanup (3개 이벤트)
- Custom Property Lifecycle (7개 이벤트)
- Property Value Management (4개 이벤트)
- Select-Type Property Options (6개 이벤트)
- Status-Type Property Management (6개 이벤트)
- Date-Type Property Configuration (8개 이벤트)
- Media-Type Property Management (6개 이벤트)
- Profile-Type Property Management (5개 이벤트)
- Readonly Property Management (5개 이벤트)
- Block Tool Execution (8개 이벤트)

**총 65개 이벤트**

---

## 🔗 Context 간 관계 및 통합점

### Block Management ↔ Canvas Management
- **연결점**: 캔버스에서 블록 정보 조회 및 툴 실행 결과 연결
- **데이터 흐름**: 
  - `[Canvas가 블록 정보 조회]` → Canvas에서 blocks 테이블 직접 JOIN (properties JSONB 포함)
  - `[Canvas가 블록 마운트]` → 블록 ID만 저장, 블록 정보는 JOIN으로 조회
  - `[블록 툴 실행]` → `[새 블록들 생성]` → `[Canvas가 엣지로 연결]`
- **통합 방식**: 
  - Canvas Management가 blocks 테이블 직접 조회 (DB JOIN)
  - 툴 실행 결과는 Canvas Management가 엣지로 연결

### Block Management ↔ Workspace Management
- **연결점**: 
  - 워크스페이스별 블록 스코프 및 권한 관리
  - 프로필 속성의 멤버 정보 조회
  - 작성자 속성의 사용자 정보 제공
- **데이터 흐름**: 
  - `[Workspace Access Check]` → `[Block Workspace Validation]`
  - `[프로필 속성 설정]` → `[워크스페이스 멤버 검증]`
  - `[작성자 속성 자동 설정]` → `[현재 사용자 정보 조회]`
- **통합 방식**: 
  - RLS(Row Level Security) 정책 적용
  - 워크스페이스 멤버 테이블 참조 (프로필 속성)

### Block Management ↔ Supabase Storage
- **연결점**: 이미지 및 첨부파일 업로드
- **데이터 흐름**: 
  - `[미디어 속성 추가]` → `[Supabase Storage 업로드]` → `[Public URL 생성]` → `[속성 값으로 저장]`
  - `[미디어 삭제]` → `[Storage에서 파일 삭제]` → `[속성 값 제거]`
- **통합 방식**: 
  - Supabase Storage API 사용
  - 워크스페이스별 스토리지 버킷 분리

### Block Management ↔ Supabase Auth
- **연결점**: 작성자 및 편집자 정보 관리
- **데이터 흐름**: 
  - `[블록 생성]` → `[현재 인증된 사용자 조회]` → `[작성자 속성 자동 설정]`
  - `[블록 업데이트]` → `[편집시각 속성 자동 업데이트]`
- **통합 방식**: 
  - Supabase Auth 세션 정보 사용
  - RLS 정책에서 auth.uid() 활용

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **Properties와 Custom Properties 싱크 유지**
   - 문제: 정의(custom_properties)와 값(properties)이 분리되어 있어 싱크 관리 필요
   - 영향: 속성 삭제/변경 시 값이 남아있거나 정의가 없는 값 존재 가능
   - 해결: 
     - 속성 삭제 시 정의와 값 모두 제거하는 트랜잭션 처리
     - 렌더링 시 정의 없는 값은 무시
     - 값 없는 정의는 기본값으로 표시

2. **Properties JSONB 크기 제한**
   - 문제: 커스텀 속성이 많아지면 JSONB 크기가 커져 성능 저하 가능
   - 영향: Canvas 로딩 속도 저하, 업데이트 오버헤드 증가
   - 해결: 
     - MVP: 블록당 속성 개수 제한 (최대 50개)
     - 정의와 값 분리로 properties는 간단한 key-value만 저장
     - Post-MVP: 속성이 많은 블록은 별도 테이블로 마이그레이션

3. **Property Type 변경 시 데이터 호환성**
   - 문제: 속성 타입 변경 시 기존 값이 새 타입과 호환되지 않을 수 있음
   - 영향: 렌더링 오류, 사용자 혼란
   - 해결: 
     - 타입 변경 시 기존 값 보존하되, 렌더링 시 호환성 체크
     - 호환되지 않으면 빈 값으로 표시 (경고 메시지)

4. **Block Type Validation 일관성**
   - 문제: Canvas에서 사용할 블록 타입과 DB 스키마 간 불일치 가능성
   - 영향: 런타임 에러 및 데이터 무결성 문제
   - 해결: 블록 타입 enum과 validation 로직 표준화

5. **Canvas JOIN 성능 (정의와 값 분리 활용)**
   - 문제: Canvas에서 블록 정보 JOIN 시 JSONB 파싱 오버헤드
   - 영향: 캔버스 로딩 속도 저하
   - 해결: 
     - workspace_id, block_type, deleted_at 복합 인덱스 최적화
     - JSONB GIN 인덱스 추가 (속성 검색용)
     - **Canvas 렌더링 시 properties만 조회 (값만 필요)**
     - **속성 편집 UI는 custom_properties만 조회 (정의만 필요)**

### 우선순위: 중간
6. **Media Upload 용량 및 성능**
   - 문제: 대용량 이미지/파일 업로드 시 응답 시간 증가
   - 영향: 사용자 경험 저하
   - 해결: 
     - 클라이언트 사이드 파일 크기 제한 (이미지 10MB, 파일 50MB)
     - 이미지 자동 압축 및 리사이징
     - 진행률 표시 및 백그라운드 업로드

7. **Profile Property 멤버 변경 처리**
   - 문제: 워크스페이스에서 멤버 제거 시 프로필 속성 값 처리
   - 영향: 데이터 무결성 문제, 렌더링 오류
   - 해결: 
     - 멤버 제거 시 해당 프로필 속성 값 null로 변경
     - 렌더링 시 "Removed User" 표시

8. **Status Group 구조 변경**
   - 문제: 상태 그룹 구조가 고정되어 있어 커스터마이징 제한
   - 영향: 사용자 요구사항 충족 어려움
   - 해결: 
     - MVP: 기본 3그룹 (진행전/진행중/완료) 고정
     - Post-MVP: 그룹 추가/삭제/이름 변경 지원

9. **Block Tool 실행 타임아웃**
   - 문제: 툴 실행이 오래 걸리면 사용자가 기다려야 함
   - 영향: 사용자 경험 저하
   - 해결: 
     - 툴 실행 시간 제한 (30초)
     - 백그라운드 실행 + 완료 알림
     - 진행률 표시

### 우선순위: 낮음
10. **Property 순서 변경 성능**
    - 문제: 속성이 많을 때 순서 변경 시 custom_properties 배열 재정렬 필요
    - 영향: 약간의 응답 지연
    - 해결: 
      - MVP: 클라이언트 사이드 Optimistic Update
      - Post-MVP: fractional indexing 도입

11. **Soft Delete 정리 전략**
    - 문제: 삭제된 블록이 계속 쌓여 스토리지 및 성능 이슈 가능성
    - 영향: 장기적인 스토리지 비용 증가
    - 해결: 주기적인 배치 작업으로 오래된 삭제 블록 완전 제거 (90일 후)

12. **AI Tool Call 오용**
    - 문제: AI가 부적절한 툴을 호출하거나 과도하게 호출
    - 영향: 불필요한 블록 생성, 성능 저하
    - 해결: 
      - 툴 호출 제한 (분당 10회)
      - 툴 실행 결과 검증
      - 사용자 확인 프롬프트

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **Block 기본 CRUD with Properties**
   - 기회: 블록 생성, 수정, 삭제 및 속성 시스템 통합 제공
   - 구현: 
     - Block Manager를 통한 블록 생명주기 관리
     - JSONB 기반 properties 저장
     - 타입별 기본 속성 초기화

2. **Custom Properties CRUD**
   - 기회: 사용자가 자유롭게 속성 추가/편집/삭제
   - 구현: 
     - 속성 추가/복제/삭제 API
     - 속성 타입 변경 로직 (값 보존)
     - 속성 순서 및 가시성 관리

3. **Property Type System**
   - 기회: 다양한 속성 타입 지원으로 유연한 데이터 모델링
   - 구현: 
     - 텍스트형 (text, url, email, phone)
     - 선택형 (select, multi-select, status)
     - 날짜형 (date, date+time, date range)
     - 미디어형 (image, file)
     - 프로필형 (profile, readonly profiles)

4. **Select & Status Property Options Management**
   - 기회: 선택형 속성의 옵션 관리 UI/UX
   - 구현: 
     - 옵션 추가/복제/삭제
     - 옵션 라벨 및 색상 설정
     - 상태 그룹 관리 (진행전/진행중/완료)

5. **Media Upload Integration**
   - 기회: Supabase Storage를 활용한 미디어 관리
   - 구현: 
     - 이미지/파일 업로드 API
     - Public URL 생성
     - 미디어 삭제 및 정리

6. **Canvas JOIN 최적화**
   - 기회: Canvas에서 효율적인 블록 정보 조회
   - 구현: 
     - workspace_id, block_type, deleted_at 복합 인덱스
     - JSONB GIN 인덱스 (속성 검색용)

7. **Block Type 및 Property Validation**
   - 기회: 블록 및 속성 데이터 무결성 보장
   - 구현: 
     - 블록 타입별 validation 로직
     - 속성 타입별 값 검증
     - 프로필 속성 멤버 검증

8. **Block Tools Foundation**
   - 기회: 블록 타입별 특화 기능 제공
   - 구현: 
     - 툴 정의 인터페이스
     - 툴 실행 엔진
     - 툴 결과 파싱 및 블록 생성
     - Canvas 엣지 연결

### 향후 구현 (Post-MVP)
9. **Advanced Property Features** *(메모)*
   - 속성 템플릿 (자주 사용하는 속성 조합 저장)
   - 속성 그룹핑 (섹션별로 속성 분류)
   - 조건부 속성 (다른 속성 값에 따라 표시/숨김)
   - 계산 속성 (다른 속성 값을 기반으로 자동 계산)

10. **Block Versioning & History** *(메모)*
    - 블록 변경 이력 관리
    - 블록 버전별 롤백 기능
    - 속성 변경 히스토리 추적

11. **Block Component System** *(메모)*
    - 블록 컴포넌트화 (템플릿 + 인스턴스)
    - 컴포넌트 속성 정의 공유
    - 인스턴스별 속성 값 개별 관리
    - 컴포넌트 업데이트 시 모든 인스턴스 반영

12. **Block Template & Preset** *(메모)*
    - 재사용 가능한 블록 템플릿 시스템
    - 블록 프리셋 및 기본값 관리
    - 워크스페이스/전역 템플릿 공유

13. **Block 복제 기능** *(메모)*
    - Canvas에서 블록 복제 요청 처리
    - 메타데이터 및 속성 완전 복사
    - 미디어 파일 복제 옵션

14. **Advanced Block Tools** *(메모)*
    - 툴 마켓플레이스 (커뮤니티 툴 공유)
    - 커스텀 툴 제작 인터페이스
    - 툴 체이닝 (툴 실행 결과를 다른 툴의 입력으로)
    - 툴 실행 이력 및 결과 캐싱

15. **Property-based Views & Filters** *(메모)*
    - 속성 기반 블록 필터링
    - 속성 기반 정렬
    - 속성 기반 그룹핑
    - 데이터베이스 뷰 (Notion-like)

16. **Cross-Block Property Relations** *(메모)*
    - 블록 간 속성 참조 (Relation)
    - 롤업 속성 (관련 블록의 속성 집계)
    - 양방향 링크 관리

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. Properties JSONB 저장 및 검증 (핵심)
- Q: 커스텀 속성의 JSONB 구조는 어떻게 설계할 것인가?
- Q: 속성 타입별 값 검증은 어떻게 구현할 것인가?
- Q: 속성 타입 변경 시 기존 값 마이그레이션 로직은?
- Q: 속성 개수 제한은 어떻게 강제할 것인가? (최대 50개)
- Q: JSONB 파싱 성능 최적화 전략은?

### 2. Property Type System 구현 (핵심)
- Q: 각 속성 타입의 값 스키마는 어떻게 정의할 것인가?
- Q: 선택형 속성의 옵션 관리는 어떻게 구현할 것인가?
- Q: 상태형 속성의 그룹 구조는 어떻게 저장할 것인가?
- Q: 날짜형 속성의 옵션 (시간/종료일)은 어떻게 저장할 것인가?
- Q: 프로필 속성의 멤버 검증은 어떻게 수행할 것인가?
- Q: Readonly 속성의 자동 설정 로직은 어디서 수행할 것인가?

### 3. Media Upload 처리 (핵심)
- Q: Supabase Storage 버킷 구조는? (워크스페이스별 분리 vs 전역 버킷)
- Q: 이미지 업로드 시 자동 압축/리사이징은 클라이언트 vs 서버?
- Q: 미디어 파일 삭제 시 Storage 정리는 동기 vs 비동기?
- Q: Public URL 생성 및 만료 정책은?
- Q: 파일 크기 제한은 어떻게 강제할 것인가?

### 4. Block Tools 실행 엔진 (핵심)
- Q: 블록 타입별 툴 정의는 어떤 구조로 관리할 것인가?
- Q: 툴 실행은 동기 vs 비동기?
- Q: 툴 실행 결과를 블록으로 파싱하는 로직은 어디에 위치할 것인가?
- Q: AI Tool Call 시 툴 파라미터 검증은 어떻게 수행할 것인가?
- Q: 툴 실행 타임아웃 및 에러 처리 전략은?
- Q: 툴 실행 결과의 엣지 연결은 Canvas Domain이 담당?

### 5. Canvas Management 연동 처리
- Q: Canvas에서 블록 정보 JOIN 시 properties JSONB를 전부 가져올 것인가?
- Q: Canvas 렌더링 시 필요한 속성만 선택적으로 파싱할 것인가?
- Q: Canvas 조회 성능을 위한 최적의 인덱스 전략은? (workspace_id + block_type + deleted_at + GIN)
- Q: 삭제된 블록이 Canvas에 마운트된 경우 어떻게 처리할 것인가?
- Q: 블록 속성 변경 시 Canvas 실시간 반영은?

### 6. Block Type 및 Default Properties
- Q: 블록 타입 정의는 어떤 파일 구조로 관리할 것인가? (constants? config?)
- Q: 블록 타입별 기본 속성 스키마는 어떻게 정의할 것인가?
- Q: 새로운 블록 타입 추가 시 확장성은 어떻게 보장할 것인가?
- Q: 블록 타입과 UI 컴포넌트 매핑은 어떻게 관리할 것인가?

### 7. Workspace Isolation 및 성능
- Q: 워크스페이스별 블록 격리는 RLS만으로 충분한가?
- Q: 프로필 속성의 멤버 검증 시 워크스페이스 체크는?
- Q: 블록 조회 성능 최적화를 위한 인덱스 전략은?
- Q: 소프트 삭제된 블록의 완전 삭제 주기는 얼마로 설정할 것인가? (90일?)

### 8. Property UI/UX 상호작용
- Q: 속성 추가/삭제 시 Optimistic Update를 사용할 것인가?
- Q: 속성 순서 변경은 드래그앤드롭으로 구현? 순서 저장 방식은?
- Q: 속성 가시성 토글 시 기존 값은 보존?
- Q: 속성 타입 변경 시 사용자 확인 프롬프트가 필요한가?

---

## 📝 Process Model 준비 상태

Block Management Domain의 핵심 이벤트, 속성 시스템, 툴 시스템이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 
   - 블록 생성/수정/삭제 커맨드
   - 커스텀 속성 CRUD 커맨드
   - 속성 타입별 값 설정 커맨드
   - 미디어 업로드 커맨드
   - 블록 툴 실행 커맨드

2. **Policy** 정의: 
   - 블록 타입 검증 규칙
   - 속성 타입별 값 검증 정책
   - 속성 개수 제한 정책 (최대 50개)
   - 프로필 속성 멤버 검증 정책
   - Readonly 속성 자동 설정 정책
   - 워크스페이스 격리 정책
   - 미디어 크기 제한 정책
   - 툴 실행 타임아웃 정책
   - 소프트 삭제 규칙

3. **Read Model** 명시: 
   - Canvas JOIN을 위한 블록 정보 구조 (properties JSONB 포함)
   - 속성 타입별 렌더링 데이터 구조
   - 프로필 속성의 멤버 정보 조인
   - 툴 실행 결과 구조

4. **External System**: 
   - Canvas Management Domain과의 DB JOIN 통합 방식
   - Workspace Management Domain의 멤버 정보 참조
   - Supabase Storage 통합 (업로드/삭제/URL 생성)
   - Supabase Auth 통합 (작성자 정보)

5. **Aggregate & Entity 설계**:
   - Block Aggregate (root)
   - CustomProperty Entity
   - PropertyOption Value Object
   - BlockTool Value Object

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 
- 2025-01-27: Canvas Management 연동 요구사항 분석
- 2025-10-22: 속성 시스템 및 툴 시스템 확장

**참가자**: 
- **시니어 개발자**: AI Assistant (도메인 설계 및 연동 인터페이스 분석)
- **주니어 개발자**: 사용자 (속성 시스템 요구사항 제시 및 논의)

**워크샵 결과물**:
- [x] Canvas Management 연동을 위한 핵심 이벤트 목록 완성
- [x] 속성 시스템 전체 이벤트 정의 완료 (7개 카테고리, 48개 이벤트)
- [x] 블록 툴 시스템 이벤트 정의 완료 (8개 이벤트)
- [x] BlockDomainService 인터페이스 요구사항 식별 완료
- [x] Bounded Context 경계 정의 완료 (Block Management 단일 Context)
- [x] Canvas Management와의 통합점 및 데이터 흐름 정리 완료
- [x] JSONB 기반 속성 저장 전략 결정 (정의와 값 분리) 및 성능 분석 완료
- [x] 외부 시스템 통합점 명확화 (Supabase Storage, Workspace Management)
- [x] 12개 Hotspots 및 16개 Opportunities 정리 완료
- [x] 8개 카테고리 41개 Process Modeling 질문 정리 완료
- [x] MVP vs Post-MVP 기능 우선순위 정리 완료

**주요 의사결정**:
1. ✅ **JSONB 기반 속성 저장 (정의와 값 분리)** 선택
   - `properties`: 값만 저장 (간단한 key-value)
   - `custom_properties`: 커스텀 속성 정의만 저장
   - Canvas JOIN 성능 최적화 우선
   - RLS 정책 단순화
   - **컴포넌트화 대응 완벽** (custom_properties만 컴포넌트로 이동)
   - 선택적 파싱 (값만/정의만 필요할 때 각각 파싱)

2. ✅ **속성 타입 체계** 확정
   - 텍스트형 (text, url, email, phone)
   - 선택형 (select, multi-select, status)
   - 날짜형 (date, date+time, date range)
   - 미디어형 (image, file)
   - 프로필형 (profile, readonly profiles)

3. ✅ **블록 툴 실행 모델** 확정
   - 툴 정의: 코드베이스 정적 정의
   - 실행 주체: 사용자 또는 AI
   - 결과 처리: 새 블록 생성 + Canvas 엣지 연결

4. ✅ **속성 타입 변경 정책** 확정
   - 기존 값 보존
   - 렌더링 시 호환성 검사
   - 호환 불가 시 빈 값 표시

5. ✅ **성능 최적화 전략** 확정
   - 블록당 속성 최대 50개 제한
   - workspace_id + block_type + deleted_at 복합 인덱스
   - JSONB GIN 인덱스 (속성 검색용)

---

## 🔗 연관 도메인

### Canvas Management Domain과의 관계
- **연결점**: 
  - 캔버스에서 블록 정보 조회를 위한 DB 연동
  - 블록 툴 실행 결과의 엣지 연결
- **데이터 흐름**: 
  - Canvas Management → Block Management (blocks 테이블 직접 JOIN, properties JSONB 포함)
  - Block Tool 실행 → 새 블록 생성 → Canvas Management (엣지 연결)
- **통합 방식**: 
  - Canvas에서 blocks 테이블 직접 조회 (DB JOIN)
  - 공통 RLS 정책으로 워크스페이스 격리
  - deleted_at IS NULL 조건으로 삭제 블록 필터링
  - 툴 실행 결과는 Canvas가 엣지로 연결

### Workspace Management Domain과의 관계  
- **연결점**: 
  - 워크스페이스별 블록 스코프 및 접근 권한 관리
  - 프로필 속성의 멤버 정보 제공
  - 작성자 속성의 사용자 정보 제공
- **데이터 흐름**: 
  - Workspace Management → Block Management (RLS 정책 적용, 멤버 정보 조회)
  - 프로필 속성 설정 시 멤버 검증
  - 작성자 속성 자동 설정 시 현재 사용자 정보
- **통합 방식**: 
  - RLS 정책: 워크스페이스별 블록 접근 제어
  - 권한 검증: 워크스페이스 멤버십 기반 블록 접근 관리
  - 프로필 속성: workspace_members 테이블 참조

### Supabase Storage와의 관계
- **연결점**: 이미지 및 첨부파일 업로드
- **데이터 흐름**: 
  - 미디어 속성 추가 → Supabase Storage 업로드 → Public URL 생성 → 속성 값 저장
  - 미디어 삭제 → Storage 파일 삭제 → 속성 값 제거
- **통합 방식**: 
  - Supabase Storage API 사용
  - 워크스페이스별 스토리지 버킷 분리 권장
  - Public URL 또는 Signed URL 사용

### Supabase Auth와의 관계
- **연결점**: 작성자 및 편집자 정보 관리
- **데이터 흐름**: 
  - 블록 생성 시 현재 인증된 사용자 조회 → 작성자 속성 자동 설정
  - 블록 업데이트 시 편집시각 속성 자동 업데이트
- **통합 방식**: 
  - Supabase Auth 세션 정보 사용
  - RLS 정책에서 auth.uid() 활용
  - Readonly 속성으로 사용자 정보 저장

---

*이 Event Storming 문서는 Block Management Domain의 핵심 기능 (블록 관리, 속성 시스템, 툴 시스템) 및 Canvas Management Domain 연동 요구사항을 정의합니다. 총 65개 이벤트, 9개 시나리오, 12개 Hotspots, 16개 Opportunities, 41개 Process Modeling 질문이 포함되어 있으며, JSONB 기반 정의-값 분리 전략을 채택하여 컴포넌트화 대응력과 성능을 최적화했습니다.*
