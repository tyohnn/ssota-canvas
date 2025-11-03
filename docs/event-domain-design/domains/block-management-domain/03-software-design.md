# Software Design: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자  
**작성일**: 2025-10-22  
**버전**: v2.0

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-db-schema.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Block Management Domain의 Bounded Context를 정의합니다.

이 도메인은 **Canvas Management Domain과의 연동을 통한 블록 관리 기능**을 제공하며, **유연한 속성 시스템**과 **블록 타입별 특화 기능(Tools)**을 포함합니다.

### 🟪 External System 처리
- **Canvas Management Domain** (내부 도메인): Service 주입으로 호출, DB JOIN으로 직접 조회
- **Workspace Management Domain** (내부 도메인): RLS 정책으로 워크스페이스 격리 처리
- **Supabase Storage** (External): ACL을 통한 미디어 파일 저장
- **Supabase Auth** (External): ACL을 통한 사용자 인증

### 핵심 설계 원칙
1. **유연한 속성 시스템**: JSONB 기반 정의-값 분리 구조로 확장 가능
2. **블록 타입별 특화**: 각 블록 타입마다 기본 속성, 커스텀 속성, Tools 지원
3. **직접 조회 최적화**: Canvas가 blocks 테이블을 직접 JOIN으로 조회
4. **RLS 기반 격리**: DB 레벨에서 워크스페이스 격리
5. **소프트 삭제**: deleted_at으로 데이터 보존
6. **External System 보호**: ACL로 Supabase Storage/Auth 변경으로부터 도메인 보호

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Block Manager | **Block Aggregate** | 블록 생성, 수정, 삭제 관리 |
| Property Manager | **Block Aggregate** (일부) | 커스텀 속성 추가, 타입 변경 |
| Property Value Manager | **Block Aggregate** (일부) | 속성 값 설정 및 검증 |
| Media Upload Manager | **Block Aggregate** (일부) | 미디어 업로드 및 Storage 연동 |
| Media Deletion Manager | **Block Aggregate** (일부) | 미디어 파일 삭제 |
| Block Tool Executor | **Block Aggregate** (일부) | 블록 툴 실행 |
| AI Block Tool Executor | **Block Aggregate** (일부) | AI 블록 툴 실행 |

**설계 결정**: 모든 System이 Block 중심의 작업을 수행하므로 단일 Block Aggregate로 통합

---

## 📦 Aggregate 상세 정의

### 1. Block Aggregate

**핵심 개념**: "재사용 가능한 콘텐츠 단위로, 유연한 속성 시스템과 블록 타입별 특화 기능(Tools)을 제공하며, Canvas에서 마운트하여 사용할 수 있는 범용 블록"

#### Commands (받는 명령) - 실제 구현 기준
**블록 생명주기**:
- **CreateBlock**: 새로운 블록 생성 (blockId, userId, workspaceId, blockType, title)
- **UpdateBlock**: 블록 정보 업데이트 (blockId, updateData: {title?, properties?})
- **UpdateBlockProperty**: 블록 속성 업데이트 (blockId, propertyPath, value, workspaceId)
- **DeleteBlock**: 블록 삭제 (소프트 삭제) (blockId)
- **DuplicateBlock**: 블록 복제 (userId)

**참고**: 커스텀 속성 관리, 미디어 관리, 블록 툴 실행은 Aggregate 레벨이 아닌 Entity나 Service 레벨에서 처리됨
- 커스텀 속성: Block Entity의 addCustomPropertyDefinition, updateCustomPropertyDefinition, removeCustomPropertyDefinition 메서드
- 미디어 관리: BlockToolService에서 별도 처리 (미구현)
- 블록 툴 실행: BlockToolService에서 별도 처리

**속성 값 관리**:
- **SetPropertyValue**: 속성 값 설정
- **UpdateBlockProperty**: 블록 속성 업데이트 (기본 속성 및 커스텀 속성)
- **ClearPropertyValue**: 속성 값 초기화

**미디어 관리**:
- **UploadMedia**: 미디어 파일 업로드
- **DeleteMediaFile**: 미디어 파일 삭제 (properties에서 URL 제거, Storage는 보존)

**블록 툴 실행**:
- **ExecuteBlockTool**: 블록 툴 실행 (사용자)
- **ExecuteBlockToolByAI**: 블록 툴 실행 (AI)

#### Events (발생 이벤트)
**블록 생명주기**:
- **BlockCreated**: 블록이 생성되었다 (blockId, blockType, title, properties, customProperties, workspaceId, userId)
- **BlockUpdated**: 블록이 업데이트되었다 (blockId, updateData)
- **BlockPropertyUpdated**: 블록 속성이 업데이트되었다 (blockId, propertyPath, oldValue, newValue)
- **BlockDeleted**: 블록이 삭제되었다 (blockId, workspaceId)
- **BlockDuplicated**: 블록이 복제되었다 (originalBlockId, duplicatedBlockId)

**참고**: 
- 커스텀 속성, 미디어, 블록 툴 관련 이벤트는 현재 Aggregate 레벨에서 발생하지 않음
- 커스텀 속성 변경은 Entity 레벨에서 처리되며 Service에서 로깅 처리
- 미디어 및 블록 툴 실행은 BlockToolService에서 별도 처리 (미구현)

#### 핵심 불변식 (Invariants)
**블록 생명주기**:
1. 블록은 반드시 하나의 워크스페이스에 속한다
2. 블록 타입은 지원되는 타입(youtube, python, markdown 등)만 허용된다
3. 삭제된 블록(deleted_at이 설정된 블록)은 수정할 수 없다

**커스텀 속성 관리**:
4. 블록당 최대 50개의 커스텀 속성만 가질 수 있다
5. custom_properties(정의)와 properties(값)는 동시에 업데이트되어야 한다
6. 속성 타입 변경 시 기존 값은 보존되지만 호환되지 않는 값은 빈 값으로 표시된다

**속성 값 관리**:
7. 속성 값은 속성 타입에 맞는 형식이어야 한다 (타입별 값 검증)
8. 프로필 속성은 워크스페이스 멤버만 할당 가능하다
9. Readonly 속성(작성자, 생성시각, 편집시각)은 시스템만 설정 가능하다
10. 블록 속성 업데이트 시 속성 경로는 properties.* 형태여야 한다
11. 블록 속성 업데이트 시 이전 값과 새 값을 기록해야 한다

**미디어 파일 관리**:
12. 이미지는 최대 10MB, 파일은 최대 50MB까지만 업로드 가능하다
13. 지원되는 MIME 타입만 업로드 가능하다
14. 미디어 파일 삭제 시 properties에서 URL만 제거하고, Storage 파일은 보존한다

**블록 툴 실행**:
15. 툴 실행 시 사용자 권한 확인이 필요하다
16. AI 툴 실행 시에도 사용자 권한 기반으로 확인한다
17. 툴 실행 타임아웃은 30초로 제한된다

#### 속성 (Properties)
```typescript
{
  id: BlockId,                        // 블록 고유 식별자 (UUID)
  workspaceId: WorkspaceId,           // 워크스페이스 ID (RLS 정책용)
  blockType: BlockType,               // 블록 타입 (youtube, python, markdown 등)
  
  // ✅ 값만 저장 (간단한 key-value)
  properties: {                       // JSONB 컬럼
    // 기본 속성 값
    youtubeUrl: "https://youtube.com/...",
    
    // 커스텀 속성 값 (property id를 key로 사용)
    "prop-1": "중요한 영상",
    "prop-2": "opt-1",
    "prop-3": ["tag-1", "tag-3"],     // 멀티선택: 배열로 저장
    "prop-4": "user-id-123"
  },
  
  // ✅ 커스텀 속성 정의만 저장
  custom_properties: [                // JSONB 배열
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
      name: "태그",
      type: "multiselect",
      options: [
        { id: "tag-1", label: "중요", color: "red" },
        { id: "tag-2", label: "긴급", color: "orange" },
        { id: "tag-3", label: "검토완료", color: "green" }
      ],
      order: 2,
      visible: true
    },
    {
      id: "prop-4",
      name: "담당자",
      type: "profile",
      order: 3,
      visible: true
    }
  ],
  
  createdAt: Date,                    // 생성 시각
  updatedAt: Date,                    // 수정 시각
  deletedAt: Date | null              // 삭제 시각 (소프트 삭제)
}
```

#### 비즈니스 로직 (실제 구현 기준)
**블록 생명주기 (Aggregate 레벨)**:
- **create()**: Block.create() 호출, BlockPropertiesFactory로 타입별 기본 속성 초기화, BlockCreated 이벤트 발생
- **update()**: Block.update() 호출, BlockUpdated 이벤트 발생
- **updateProperty()**: properties.xxx 경로만 처리, Block.update()로 속성 업데이트, BlockPropertyUpdated 이벤트 발생
- **delete()**: Block.markAsDeleted() 호출, BlockDeleted 이벤트 발생
- **duplicate()**: Block.duplicate() 호출, BlockDuplicated 이벤트 발생
- **restore()**: Block.restore() 호출, BlockUpdated 이벤트 발생

**커스텀 속성 관리 (Entity 레벨)**:
- **addCustomPropertyDefinition()**: Block Entity 메서드, customProperties 배열에 추가, updatedAt 갱신 (이벤트 없음)
- **updateCustomPropertyDefinition()**: Block Entity 메서드, customProperties 배열 업데이트, updatedAt 갱신 (이벤트 없음)
- **removeCustomPropertyDefinition()**: Block Entity 메서드, customProperties 배열에서 제거, updatedAt 갱신 (이벤트 없음)
- 참고: 정의-값 동시 업데이트는 Service 레벨에서 처리

**속성 값 관리 (Aggregate/Entity 레벨)**:
- **updateProperty()**: Aggregate 메서드, properties.xxx 경로만 지원, BlockPropertiesVO Value Object로 검증 및 업데이트

**블록 타입 및 툴 (Entity 레벨)**:
- **updateBlockType()**: Block Entity 메서드, 블록 타입 변경 시 기본 속성 재설정
- **getAvailableTools()**: Block Entity 메서드, BlockType Value Object에서 툴 목록 반환
- **supportsTool()**: Block Entity 메서드, 특정 툴 지원 여부 확인

**미디어 파일 관리**:
- 현재 Aggregate/Entity 레벨에서 직접 구현되지 않음, BlockToolService에서 별도 처리 예정 (미구현)

**블록 툴 실행**:
- 현재 Aggregate 레벨에서 직접 구현되지 않음, BlockToolService에서 별도 처리

---

## 🔲 Bounded Context 정의

### Block Management Context

**언어적 특징**:
- "Block" = 재사용 가능한 콘텐츠 단위
- "BlockType" = 블록의 종류 (youtube, python, markdown 등)
- "Properties" = 블록 타입별 기본 속성 및 커스텀 속성
- "Custom Properties" = 사용자가 정의하는 추가 속성 (정의)
- "Property Values" = 속성의 실제 값
- "Block Tools" = 블록 타입별 특화 기능
- "Soft Delete" = deleted_at 타임스탬프 기반 삭제

**핵심 책임**:
- 블록 생명주기 관리 (생성, 삭제)
- 블록 타입별 기본 속성 및 커스텀 속성 관리
- 블록 속성 값 관리 및 타입별 검증
- 미디어 파일 업로드 및 Supabase Storage 연동
- 블록 타입별 툴 실행 및 결과 처리
- 워크스페이스별 블록 격리 (RLS 정책)
- Canvas Management Domain을 위한 블록 데이터 제공

**포함된 Aggregates**:
- Block Aggregate (블록 생명주기, 속성 시스템, 툴 실행 관리)

**External System Integration**:
- **Canvas Management Domain** (내부 도메인): 
  - Service 주입으로 블록 생성/삭제 호출
  - Canvas에서 blocks 테이블 직접 JOIN으로 조회
  - 공통 RLS 정책으로 워크스페이스 격리
- **Workspace Management Domain** (내부 도메인): 
  - RLS 정책으로 워크스페이스 접근 제어
  - workspace_id 기반 필터링
- **Supabase Storage** (External System):
  - ACL(SupabaseStorageAdapter)을 통한 미디어 파일 저장
  - Public URL 생성 및 반환
- **Supabase Auth** (External System):
  - ACL(SupabaseAuthAdapter)을 통한 사용자 인증
  - 작성자 정보 조회

---

## 🔀 다른 Context와의 경계

### Canvas Management Context와의 경계

**언어적 차이**:
| Block Management Context | Canvas Management Context |
|---------------------|-------------------|
| "Block" (범용 콘텐츠 단위) | "Block Mount" (캔버스에 배치된 블록) |
| "BlockType" (블록 종류) | "Node" (React Flow 노드) |
| "Properties" (블록 속성) | "Position/Size" (배치 정보) |
| "Custom Properties" (사용자 정의 속성) | (Canvas에서 조회만 수행) |
| "Block Tools" (블록 기능) | (Canvas에서 실행 요청만) |

**통합 방식**:
- **Service 주입**: Canvas Management가 Block Management Service를 주입하여 블록 생성/삭제 호출
- **DB JOIN**: Canvas에서 blocks 테이블 직접 JOIN으로 조회
- `block_mounts.block_id → blocks.id` 관계
- deleted_at IS NULL 조건으로 삭제 블록 필터링

**통합 이벤트**:
- `BlockCreated` → Canvas Management가 블록 마운트 처리
- `BlockDeleted` → Canvas Management가 마운트 해제 처리

### Workspace Management Context와의 경계

**언어적 차이**:
| Block Management Context | Workspace Management Context |
|---------------------|-------------------|
| "Block" | "Workspace Resource" |
| "workspace_id" (소속 워크스페이스) | "Workspace" (소유 주체) |
| "Profile Property" (멤버 속성) | "Workspace Member" (멤버 관리) |

**통합 방식**:
- RLS 정책으로 워크스페이스 격리
- workspace_id 기반 접근 제어
- 프로필 속성 검증 시 워크스페이스 멤버 확인

### Supabase Storage와의 경계 (External System)

**언어적 차이**:
| Block Management Context | Supabase Storage |
|---------------------|-----------------|
| "Media URL" (미디어 URL) | "Storage Path" (저장 경로) |
| "File Upload" (파일 업로드) | "Storage Upload" (스토리지 업로드) |

**통합 방식**:
- ACL(SupabaseStorageAdapter)을 통한 보호
- 파일 업로드 → Public URL 생성 → properties에 저장
- 파일 삭제 시 Storage 파일 보존

### Supabase Auth와의 경계 (External System)

**언어적 차이**:
| Block Management Context | Supabase Auth |
|---------------------|--------------|
| "Author" (작성자) | "User" (사용자) |
| "userId" (사용자 ID) | "Supabase User ID" |

**통합 방식**:
- ACL(SupabaseAuthAdapter)을 통한 보호
- 세션 정보 조회 → 작성자 정보 반환
- 프로필 속성에 작성자 정보 저장

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│         Workspace Management Context                    │
│                 (RLS 정책 제공)                          │
└─────────────────┬───────────────────────────────────────┘
                  │ RLS Policy (Conformist)
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Block Management Context                   │
│                                                         │
│  ┌───────────────────────────────────────┐             │
│  │       Block Aggregate                 │             │
│  │                                       │             │
│  │  블록 생명주기:                        │             │
│  │  • CreateBlock                        │             │
│  │  • DeleteBlock                        │             │
│  │                                       │             │
│  │  커스텀 속성:                         │             │
│  │  • AddCustomProperty                  │             │
│  │  • ChangePropertyType                 │             │
│  │  • DeleteCustomProperty               │             │
│  │                                       │             │
│  │  속성 값:                             │             │
│  │  • SetPropertyValue                   │             │
│  │  • ClearPropertyValue                 │             │
│  │                                       │             │
│  │  미디어:                              │             │
│  │  • UploadMedia                        │             │
│  │  • DeleteMediaFile                    │             │
│  │                                       │             │
│  │  블록 툴:                             │             │
│  │  • ExecuteBlockTool                   │             │
│  │  • ExecuteBlockToolByAI               │             │
│  │                                       │             │
│  └───────────────────────────────────────┘             │
│                                                         │
└─────┬──────────────┬────────────────────────────────────┘
      │              │
      │              │ DB JOIN (blocks 테이블)
      │              ▼
      │    ┌─────────────────────────────────────────────┐
      │    │   Canvas Management Context                │
      │    │   (blocks 테이블 직접 조회)                 │
      │    │   + Service 주입 (Customer-Supplier)      │
      │    └─────────────────────────────────────────────┘
      │
      │ ACL (Anti-Corruption Layer)
      ▼
┌─────────────────────────────────────────────────────────┐
│         External Systems                                │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │ Supabase Storage │    │  Supabase Auth   │         │
│  │                  │    │                  │         │
│  │ • File Upload    │    │ • User Auth      │         │
│  │ • Public URL     │    │ • User Profile   │         │
│  └──────────────────┘    └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

**Context 간 통합 패턴**:
- **Block Management → Workspace Management**: Conformist (RLS 정책 따름)
- **Canvas Management → Block Management**: Customer-Supplier (Service 주입) + DB JOIN
- **Block Management → Supabase Storage**: Anti-Corruption Layer
- **Block Management → Supabase Auth**: Anti-Corruption Layer

---

## 💡 핵심 설계 결정

### 1. Properties 저장 전략: 정의-값 분리 (JSONB) - 실제 구현 기준
- **문제**: 커스텀 속성 정의와 값을 어떻게 저장할 것인가?
- **해결**: custom_properties(정의)와 properties(값)를 JSONB로 분리 저장
- **실제 구현**:
  - properties: JSONB 객체, 속성 값만 저장 (BlockPropertiesVO Value Objects로 타입별 검증)
  - custom_properties: JSONB 배열, 속성 정의만 저장 (CustomPropertyDefinitionVO Value Objects)
  - BlockPropertiesFactory로 블록 타입별 기본 속성 초기화
- **대안**: 
  - 단일 JSONB에 정의와 값 혼합 저장
  - 별도 properties 테이블 생성 (관계형 모델)
  - 속성 타입별 별도 테이블 생성
- **결정 이유** (실제 구현 반영): 
  - **컴포넌트화 호환**: 향후 블록 컴포넌트화 시 정의는 컴포넌트에서 관리, 값만 인스턴스가 가짐
  - **선택적 파싱**: Canvas 조회 시 properties만 선택적으로 파싱하여 성능 향상
  - **명확한 데이터 구조**: 정의와 값의 책임 분리로 이해하기 쉬움
  - **타입 안전성**: BlockPropertiesVO Value Objects로 타입별 검증 및 변환
  - **트랜잭션 최적화**: 속성 추가/삭제 시 정의와 값 동시 업데이트 용이 (Service 레벨 처리)

### 2. Canvas Management의 직접 DB 조회 방식 선택
- **문제**: Canvas Management Domain에서 블록 정보를 어떻게 가져올 것인가?
- **해결**: Canvas에서 blocks 테이블을 직접 JOIN으로 조회 + Service 주입으로 생성/삭제 호출
- **대안**: 
  - BlockDomainService를 통한 모든 작업 호출
  - 이벤트 기반 비동기 동기화
  - CQRS 패턴 적용
- **결정 이유**: 
  - 블록 정보 조회는 단순하므로 별도 서비스 레이어 불필요
  - DB JOIN이 가장 성능이 좋고 구현이 단순함
  - 생성/삭제는 비즈니스 로직이 있으므로 Service 주입 사용
  - RLS 정책으로 워크스페이스 격리가 자동 처리
  - 코드 복잡도 감소 및 유지보수 용이

### 3. 소프트 삭제 전략
- **문제**: 블록 삭제 시 Canvas에 마운트된 블록 처리 방법
- **해결**: deleted_at 타임스탬프로 소프트 삭제
- **대안**: 
  - 즉시 완전 삭제
  - 휴지통 테이블로 이동
  - 버전 관리 시스템
- **결정 이유**: 
  - Canvas 조회 시 deleted_at IS NULL 조건으로 간단히 필터링
  - 실수로 삭제된 블록 복구 가능성 확보
  - 데이터 보존으로 감사 추적 가능
  - 추후 배치 작업으로 오래된 블록 정리 가능

### 4. 단일 Block Aggregate로 통합 (실제 구현 기준)
- **문제**: Block Management Domain의 Aggregate를 어떻게 나눌 것인가?
- **해결**: 단일 Block Aggregate로 핵심 기능 통합, 일부 기능은 Entity/Service 레벨 처리
- **실제 구현**:
  - **Aggregate 레벨**: 블록 생명주기(생성, 업데이트, 삭제, 복제, 속성 업데이트)
  - **Entity 레벨**: 커스텀 속성 관리(addCustomPropertyDefinition, updateCustomPropertyDefinition, removeCustomPropertyDefinition)
  - **Service 레벨**: 미디어 관리, 블록 툴 실행(BlockToolService)
- **대안**: 
  - Property Aggregate 분리
  - BlockTool Aggregate 분리
  - Media Aggregate 분리
- **결정 이유** (실제 구현 반영): 
  - 블록 생명주기는 Block 중심으로 Aggregate 경계 명확
  - 커스텀 속성은 Entity 메서드로 충분하며 이벤트 발행 불필요
  - 미디어/툴 실행은 Service 레벨에서 별도 처리하여 Aggregate 단순화
  - 과도한 설계 방지 및 빠른 구현
  - 향후 필요 시 점진적으로 분리 가능

### 5. External System ACL 보호
- **문제**: Supabase Storage/Auth 변경으로부터 도메인을 어떻게 보호할 것인가?
- **해결**: ACL(Anti-Corruption Layer) 패턴 적용
- **대안**: 
  - 직접 Supabase API 호출
  - Wrapper 함수 사용
  - 이벤트 기반 통합
- **결정 이유**: 
  - Supabase 모델과 도메인 모델의 분리
  - Supabase API 변경 시 ACL만 수정하면 됨
  - 테스트 용이성 (Mock Adapter 사용 가능)
  - 향후 다른 Storage/Auth 시스템으로 교체 용이

---

## 📖 Read Models (Query Side)

Block Management Domain은 Canvas Management가 직접 DB JOIN으로 조회하므로 별도 Read Model이 불필요합니다.

### Canvas에서의 블록 정보 조회

Canvas Management가 다음과 같이 직접 조회합니다:

```sql
SELECT 
  bm.id as mount_id,
  bm.position_x,
  bm.position_y,
  bm.size_width,
  bm.size_height,
  b.id as block_id,
  b.block_type,
  b.workspace_id,
  b.properties,              -- JSONB: 속성 값만
  b.custom_properties,       -- JSONB: 커스텀 속성 정의만
  b.created_at,
  b.updated_at
FROM block_mounts bm
JOIN blocks b ON bm.block_id = b.id
WHERE bm.page_id = ? 
  AND bm.deleted_at IS NULL 
  AND b.deleted_at IS NULL
  AND b.workspace_id = ?     -- RLS 정책
```

**최적화 포인트**:
- **복합 인덱스**: (workspace_id, block_type, deleted_at) 복합 인덱스
- **GIN 인덱스**: properties와 custom_properties JSONB 컬럼에 GIN 인덱스
- **RLS 정책 최적화**: workspace_id 기반 필터링
- **선택적 파싱**: Canvas 렌더링 시 properties만 파싱, custom_properties는 속성 편집 시에만 파싱

---

## 🤝 Service 레이어의 역할

Block Management Domain은 Block Aggregate 중심으로 설계되었으며, Service 레이어는 외부 시스템 연동과 트랜잭션 처리를 담당합니다.

### Block Management Service의 역할

**블록 생명주기 관리** (실제 구현 기준):
- Canvas Management가 블록 생성을 요청하면, Block Management Service는 워크스페이스 권한을 확인하고, BlockAggregate.create()를 호출하여 블록을 생성합니다.
- 블록 업데이트 요청 시, BlockAggregate.update() 또는 updateProperty()를 호출합니다.
- 블록 삭제 요청 시, BlockAggregate.delete()를 호출하여 deleted_at 타임스탬프를 설정합니다.
- 블록 복제 요청 시, BlockAggregate.duplicate()를 호출하여 새 블록을 생성합니다.

**커스텀 속성 관리** (실제 구현 기준):
- 커스텀 속성 추가/수정/삭제는 Block Entity의 메서드를 직접 호출하여 처리합니다.
- BlockPropertyService에서 커스텀 속성 관리 로직을 처리합니다 (현재 부분 구현).
- 속성 개수 제한(최대 50개)은 현재 미구현이며 추후 Entity 레벨에서 검증 예정.

**속성 값 관리** (실제 구현 기준):
- 속성 값 업데이트 요청이 들어오면, BlockAggregate.updateProperty()를 호출하여 properties.xxx 경로의 속성만 업데이트합니다.
- BlockPropertiesVO Value Objects에서 타입별 값 검증을 수행합니다.
- 프로필 속성 멤버 검증은 현재 미구현 (Workspace Management 연동 필요).

**미디어 파일 관리**:
- 현재 BlockManagementService에서 직접 처리하지 않음, BlockToolService에서 별도 처리 예정 (미구현).

**블록 툴 실행** (실제 구현 기준):
- 툴 실행 요청이 들어오면, BlockToolService.executeBlockTool()을 호출합니다.
- Block Entity의 supportsTool()로 툴 지원 여부를 확인합니다.
- 툴 실행 결과는 새 블록 생성 및 Canvas Management에 전달됩니다.
- AI 툴 실행은 BlockToolService.executeBlockToolByAI()로 처리 (현재 Mock 구현).

**실패 대응 전략**:
- 속성 추가/삭제 실패 시 정의-값 싱크 유지를 위해 트랜잭션 롤백
- Supabase Storage 업로드 실패 시 최대 3회 재시도
- 블록 툴 실행 실패 시 에러 메시지를 사용자/AI에게 전달
- 타임아웃: 툴 실행은 30초 제한

**사용자 경험 개선**:
- 속성 값 설정 시 편집시각 자동 업데이트로 실시간 반영
- Canvas 조회 시 properties만 선택적으로 파싱하여 빠른 렌더링
- 미디어 업로드 진행률 표시 (Frontend에서 처리)

### Canvas Management와의 연동
- **Service 주입**: Canvas Management가 Block Management Service를 주입하여 블록 생성/삭제 호출
- **DB JOIN**: Canvas에서 blocks 테이블 직접 JOIN으로 조회 (조회는 서비스 불필요)
- **RLS 정책**: 자동 워크스페이스 격리

---

## 🛡️ Anti-Corruption Layer Design

Block Management Domain은 Supabase Storage와 Supabase Auth와의 통합을 위한 ACL을 구현합니다.

### 1. Supabase Storage Adapter

#### Interface
Supabase Storage와의 통합을 추상화하는 인터페이스:

```typescript
interface SupabaseStorageAdapter {
  uploadFile(file: File, workspaceId: string): Promise<MediaURL>
  getPublicURL(path: string): string
}
```

#### Translation Layer
Supabase Storage 데이터와 도메인 모델 간 변환:

```typescript
// 외부 시스템 모델
interface SupabaseStorageFile {
  path: string;
  bucket: string;
  fullPath: string;
}

// 도메인 모델
interface MediaURL {
  url: string;          // Public URL
  fileType: 'image' | 'file';
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

// ACL 변환
class SupabaseStorageAdapterImpl implements SupabaseStorageAdapter {
  async uploadFile(file: File, workspaceId: string): Promise<MediaURL> {
    // 1. 파일 크기 검증 (이미지 10MB, 파일 50MB)
    // 2. MIME 타입 검증
    // 3. Supabase Storage 업로드
    const storagePath = await this.supabase.storage.upload(file);
    // 4. 도메인 모델로 변환
    return this.toDomainMediaURL(storagePath);
  }
  
  private toDomainMediaURL(storagePath: SupabaseStorageFile): MediaURL {
    return {
      url: this.getPublicURL(storagePath.fullPath),
      fileType: this.determineFileType(storagePath.path),
      fileName: this.extractFileName(storagePath.path),
      fileSize: storagePath.size,
      uploadedAt: new Date()
    };
  }
}
```

#### Benefits
1. **도메인 순수성**: Supabase Storage API가 도메인에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Supabase Storage → AWS S3 전환 용이
4. **장애 격리**: Supabase Storage 장애 시 도메인 로직 보호
5. **재시도 로직**: 업로드 실패 시 최대 3회 재시도

### 2. Supabase Auth Adapter

#### Interface
Supabase Auth와의 통합을 추상화하는 인터페이스:

```typescript
interface SupabaseAuthAdapter {
  getCurrentUser(): Promise<Author>
  getUserById(userId: string): Promise<Author>
}
```

#### Translation Layer
Supabase Auth 데이터와 도메인 모델 간 변환:

```typescript
// 외부 시스템 모델
interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
}

// 도메인 모델
interface Author {
  userId: UserId;
  email: Email;
  displayName: string;
}

// ACL 변환
class SupabaseAuthAdapterImpl implements SupabaseAuthAdapter {
  async getCurrentUser(): Promise<Author> {
    const supabaseUser = await this.supabase.auth.getUser();
    return this.toDomainAuthor(supabaseUser);
  }
  
  private toDomainAuthor(supabaseUser: SupabaseUser): Author {
    return {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata.name || supabaseUser.email
    };
  }
}
```

#### Benefits
1. **도메인 순수성**: Supabase Auth API가 도메인에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Supabase Auth → Clerk 전환 용이
4. **장애 격리**: Supabase Auth 장애 시 도메인 로직 보호
5. **에러 처리**: 인증 실패 시 도메인 에러로 변환

### Canvas Management와의 통합
- **통합 방식**: Service 주입 + DB JOIN (ACL 불필요, 내부 도메인)
- **보호 계층**: RLS 정책으로 워크스페이스 격리
- **데이터 필터링**: deleted_at IS NULL 조건

### Workspace Management와의 통합
- **통합 방식**: RLS 정책 (ACL 불필요, 내부 도메인)
- **보호 계층**: DB 레벨 접근 제어
- **권한 관리**: workspace_id 기반 필터링

---

## ✅ 검증 체크리스트

### Aggregate 설계
- [x] Block Aggregate가 명확한 경계와 책임을 가지는가?
- [x] Process Model의 모든 System이 Block Aggregate로 적절히 매핑되었는가?
- [x] 핵심 불변식(속성 개수 제한, 정의-값 싱크, 타입별 검증)이 올바르게 정의되었는가?
- [x] Commands와 Events가 Process Model과 일관되게 정의되었는가?

### Context 통합
- [x] Canvas Management의 Service 주입 + DB JOIN 방식이 적절한가?
- [x] RLS 정책으로 워크스페이스 격리가 보장되는가?
- [x] Supabase Storage/Auth와의 ACL 보호가 올바르게 설계되었는가?
- [x] Context Map의 통합 패턴이 적절한가?

### 핵심 설계 결정
- [x] Properties 정의-값 분리 전략이 컴포넌트화에 적합한가?
- [x] 소프트 삭제 전략이 Canvas와 호환되는가?
- [x] 단일 Block Aggregate로 통합한 설계가 합리적인가?
- [x] External System ACL 보호가 충분한가?

### 성능 및 최적화
- [x] Canvas 조회를 위한 인덱스 전략이 적절한가?
- [x] JSONB GIN 인덱스가 정의되었는가?
- [x] 선택적 파싱 전략이 명시되었는가?

---

## 📊 성과 측정 지표

1. **블록 생성 성공률**: 블록 생성 요청 중 성공한 비율 (목표: 99% 이상)
2. **Canvas 조회 성능**: blocks 테이블 JOIN 시 응답 시간 (목표: 100ms 이하)
3. **RLS 정책 적용률**: 워크스페이스 격리가 올바르게 적용된 비율 (목표: 100%)
4. **속성 정의-값 싱크 유지율**: custom_properties와 properties 동기화 성공 비율 (목표: 100%)
5. **미디어 업로드 성공률**: Supabase Storage 업로드 성공 비율 (목표: 95% 이상)
6. **블록 툴 실행 성공률**: 툴 실행 요청 중 성공한 비율 (목표: 90% 이상)

---

## 📚 References

### 관련 문서
- [Event Storming](./01-event-storm.md)
- [Process Model](./02-process-model.md)
- [Database Schema](./04-db-schema.md) (다음 단계)
- [Canvas Management Domain Technical Specification](../canvas-management-domain/04-technical-specification.md)

---

이 Software Design 문서는 Block Management Domain의 구현을 위한 완전한 설계 지침입니다.

