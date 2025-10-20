# Software Design: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자  
**작성일**: 2025-10-19  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-db-schema.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Block Management Domain의 Bounded Context를 정의합니다.

이 도메인은 **Canvas Management Domain이 직접 DB JOIN으로 블록 정보를 조회**하는 단순한 구조이므로, 복잡한 서비스 레이어나 ACL 없이 기본적인 CRUD Aggregate 중심으로 설계합니다.

### 🟪 External System 처리
- **Canvas Management Domain**: DB JOIN으로 직접 조회하므로 별도 ACL 불필요
- **Workspace Management Domain**: RLS 정책으로 워크스페이스 격리 처리

### 핵심 설계 원칙
1. **단순성**: 블록 생성, 수정, 삭제만 지원하는 최소 구현
2. **직접 조회**: Canvas가 blocks 테이블을 직접 JOIN으로 조회
3. **RLS 기반 격리**: 별도 서비스 레이어 없이 DB 레벨에서 워크스페이스 격리
4. **소프트 삭제**: deleted_at으로 데이터 보존

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Block Manager | **Block Aggregate** | 블록 생성, 수정, 삭제 관리 |

---

## 📦 Aggregate 상세 정의

### 1. Block Aggregate

**핵심 개념**: "재사용 가능한 콘텐츠 단위 (텍스트, 이미지, 페이지 등)를 관리하며, Canvas에서 마운트하여 사용할 수 있는 범용 블록"

#### Commands (받는 명령)
- **CreateBlock**: 새로운 블록 생성
- **UpdateBlock**: 블록 정보 수정 (제목, 내용, 메타데이터)
- **DeleteBlock**: 블록 삭제 (소프트 삭제)

#### Events (발생 이벤트)
- **BlockCreated**: 블록이 생성되었다
- **BlockValidated**: 블록이 검증되었다
- **BlockMetadataSet**: 블록 메타데이터가 설정되었다
- **BlockUpdated**: 블록 정보가 업데이트되었다
- **BlockMetadataChanged**: 블록 메타데이터가 변경되었다
- **BlockDeleted**: 블록이 삭제되었다
- **BlockDataCleaned**: 블록 관련 데이터가 정리되었다

#### 핵심 불변식 (Invariants)
- 블록은 반드시 하나의 워크스페이스에 속한다
- 블록 타입은 지원되는 타입(text, image, page, shape 등)만 허용된다
- 블록 메타데이터는 블록 타입별 스키마를 준수해야 한다
- 삭제된 블록(deleted_at이 설정된 블록)은 수정할 수 없다
- 블록 제목은 500자를 초과할 수 없다
- 블록 내용은 1MB를 초과할 수 없다

#### 속성 (Properties)
```typescript
{
  id: BlockId,                    // 블록 고유 식별자 (UUID)
  workspaceId: WorkspaceId,       // 워크스페이스 ID (RLS 정책용)
  blockType: BlockType,           // 블록 타입 (text, image, page, shape 등)
  title: string | null,           // 블록 제목 (최대 500자)
  content: string | null,         // 블록 내용 (JSON 또는 텍스트, 최대 1MB)
  metadata: Record<string, any>,  // 블록 타입별 확장 속성
  createdAt: Date,                // 생성 시각
  updatedAt: Date,                // 수정 시각
  deletedAt: Date | null          // 삭제 시각 (소프트 삭제)
}
```

#### 비즈니스 로직
- **createBlock()**: 블록 타입 검증, 메타데이터 스키마 검증, 워크스페이스 제한 확인
- **updateBlock()**: 수정 권한 검증, 삭제된 블록 수정 방지, 메타데이터 스키마 재검증
- **deleteBlock()**: 삭제 권한 검증, deleted_at 타임스탬프 설정

---

## 🔲 Bounded Context 정의

### Block Management Context

**언어적 특징**:
- "Block" = 재사용 가능한 콘텐츠 단위
- "BlockType" = 블록의 종류 (text, image, page 등)
- "Metadata" = 블록 타입별 확장 속성
- "Soft Delete" = deleted_at 타임스탬프 기반 삭제

**핵심 책임**:
- 블록 생명주기 관리 (생성, 수정, 삭제)
- 블록 타입별 검증 및 메타데이터 스키마 관리
- 워크스페이스별 블록 격리 (RLS 정책)
- Canvas Management Domain을 위한 블록 데이터 제공

**포함된 Aggregates**:
- Block Aggregate (블록 CRUD 관리)

**External System Integration**:
- **Canvas Management Domain**: 
  - Canvas에서 blocks 테이블 직접 JOIN으로 조회
  - 별도 서비스 레이어 불필요
  - 공통 RLS 정책으로 워크스페이스 격리
- **Workspace Management Domain**: 
  - RLS 정책으로 워크스페이스 접근 제어
  - workspace_id 기반 필터링

---

## 🔀 다른 Context와의 경계

### Canvas Management Context와의 경계

**언어적 차이**:
| Block Management Context | Canvas Management Context |
|---------------------|-------------------|
| "Block" (범용 콘텐츠 단위) | "Block Mount" (캔버스에 배치된 블록) |
| "BlockType" (블록 종류) | "Node" (React Flow 노드) |
| "Metadata" (블록 속성) | "Position/Size" (배치 정보) |

**통합 방식**:
- Canvas에서 blocks 테이블 직접 JOIN
- `block_mounts.block_id → blocks.id` 관계
- deleted_at IS NULL 조건으로 삭제 블록 필터링

### Workspace Management Context와의 경계

**언어적 차이**:
| Block Management Context | Workspace Management Context |
|---------------------|-------------------|
| "Block" | "Workspace Resource" |
| "workspace_id" (소속 워크스페이스) | "Workspace" (소유 주체) |

**통합 방식**:
- RLS 정책으로 워크스페이스 격리
- workspace_id 기반 접근 제어

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│         Workspace Management Context                    │
│                 (RLS 정책 제공)                          │
└─────────────────┬───────────────────────────────────────┘
                  │ RLS Policy
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Block Management Context                   │
│                                                         │
│  ┌───────────────────────────────────────┐             │
│  │       Block Aggregate                 │             │
│  │                                       │             │
│  │  • CreateBlock                        │             │
│  │  • UpdateBlock                        │             │
│  │  • DeleteBlock                        │             │
│  │                                       │             │
│  └───────────────────────────────────────┘             │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │ DB JOIN (blocks 테이블)
                  ▼
┌─────────────────────────────────────────────────────────┐
│         Canvas Management Context                       │
│         (blocks 테이블 직접 조회)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Canvas Management의 직접 DB 조회 방식 선택
- **문제**: Canvas Management Domain에서 블록 정보를 어떻게 가져올 것인가?
- **해결**: Canvas에서 blocks 테이블을 직접 JOIN으로 조회
- **대안**: 
  - BlockDomainService를 통한 동기적 서비스 호출
  - 이벤트 기반 비동기 동기화
- **결정 이유**: 
  - 블록 정보는 단순한 조회이므로 별도 서비스 레이어가 불필요
  - DB JOIN이 가장 성능이 좋고 구현이 단순함
  - RLS 정책으로 워크스페이스 격리가 자동으로 처리됨
  - 코드 복잡도 감소 및 유지보수 용이

### 2. 소프트 삭제 전략
- **문제**: 블록 삭제 시 Canvas에 마운트된 블록 처리 방법
- **해결**: deleted_at 타임스탬프로 소프트 삭제
- **대안**: 
  - 즉시 완전 삭제
  - 휴지통 테이블로 이동
- **결정 이유**: 
  - Canvas 조회 시 deleted_at IS NULL 조건으로 간단히 필터링
  - 실수로 삭제된 블록 복구 가능성 확보
  - 데이터 보존으로 감사 추적 가능
  - 추후 배치 작업으로 오래된 블록 정리 가능

### 3. 단순한 Aggregate 구조
- **문제**: Block Management Domain의 복잡도를 어느 수준으로 설계할 것인가?
- **해결**: 단일 Block Aggregate로 최소 구현
- **대안**: 
  - BlockTemplate, BlockPreset 등 추가 Aggregate
  - BlockVersion, BlockHistory 등 이력 관리
- **결정 이유**: 
  - Canvas Management 구현을 위한 최소 요구사항만 충족
  - MVP 단계에서는 기본 CRUD만 필요
  - 향후 필요 시 점진적으로 확장 가능
  - 과도한 설계 방지 및 빠른 구현

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
  b.id as block_id,
  b.block_type,
  b.title,
  b.content,
  b.metadata
FROM block_mounts bm
JOIN blocks b ON bm.block_id = b.id
WHERE bm.page_id = ? 
  AND bm.deleted_at IS NULL 
  AND b.deleted_at IS NULL
```

**최적화 포인트**:
- workspace_id, block_type, deleted_at 복합 인덱스
- Canvas 조회 성능을 위한 인덱스 튜닝
- RLS 정책 최적화

---

## 🤝 Service 레이어의 역할

Block Management Domain은 단순한 CRUD 기능만 제공하므로 복잡한 Service 레이어가 불필요합니다.

### Block Repository의 역할
- **블록 생성**: 블록 타입 검증, 메타데이터 스키마 검증 후 DB 저장
- **블록 수정**: 권한 확인, 삭제 여부 확인 후 업데이트
- **블록 삭제**: deleted_at 타임스탬프 설정
- **블록 조회**: 워크스페이스별 블록 목록 조회 (RLS 정책 적용)

### Canvas Management와의 연동
- Canvas에서 blocks 테이블 직접 JOIN
- 별도 서비스 호출 불필요
- RLS 정책으로 자동 워크스페이스 격리

---

## 🛡️ Anti-Corruption Layer Design

Block Management Domain은 외부 시스템과의 직접 통합이 없으므로 ACL이 불필요합니다.

### Canvas Management와의 통합
- **통합 방식**: DB JOIN (ACL 불필요)
- **보호 계층**: RLS 정책으로 워크스페이스 격리
- **데이터 필터링**: deleted_at IS NULL 조건

### Workspace Management와의 통합
- **통합 방식**: RLS 정책
- **보호 계층**: DB 레벨 접근 제어
- **권한 관리**: workspace_id 기반 필터링

---

## ✅ 검증 체크리스트

- [x] Block Aggregate가 명확한 경계와 책임을 가지는가?
- [x] Process Model의 Block Manager System이 Block Aggregate로 적절히 매핑되었는가?
- [x] Canvas Management의 직접 DB 조회 방식이 적절한가?
- [x] RLS 정책으로 워크스페이스 격리가 보장되는가?
- [x] 핵심 불변식(블록 타입 검증, 메타데이터 스키마)이 올바르게 정의되었는가?
- [x] 소프트 삭제 전략이 Canvas와 호환되는가?

---

## 📊 성과 측정 지표

1. **블록 생성 성공률**: 블록 생성 요청 중 성공한 비율 (목표: 99% 이상)
2. **Canvas 조회 성능**: blocks 테이블 JOIN 시 응답 시간 (목표: 100ms 이하)
3. **RLS 정책 적용률**: 워크스페이스 격리가 올바르게 적용된 비율 (목표: 100%)

---

## 📚 References

### 관련 문서
- [Event Storming](./01-event-storm.md)
- [Process Model](./02-process-model.md)
- [Database Schema](./04-db-schema.md) (다음 단계)
- [Canvas Management Domain Technical Specification](../canvas-management-domain/04-technical-specification.md)

---

이 Software Design 문서는 Block Management Domain의 구현을 위한 완전한 설계 지침입니다.

