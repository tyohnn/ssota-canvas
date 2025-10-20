# Event Storming: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자 (Canvas Management 연동)  
**작성일**: 2025-10-19  
**버전**: v1.0

**목적**: Canvas Management Domain 구현을 위한 최소한의 Block Management Domain 설계
**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 범용 블록 시스템을 통한 재사용 가능한 콘텐츠 관리 및 Canvas Management Domain과의 협력을 통한 캔버스 내 블록 조작 지원

## 📝 핵심 개념 정리

### Block Core Concepts
```
Block System
├── Block Definition (블록 정의)
│   ├── Block Type (텍스트, 이미지, 페이지 등)
│   ├── Metadata (블록별 특화 데이터)
│   └── Workspace Scope (워크스페이스별 고유성)
└── Block Lifecycle
    ├── 생성 → 검증 → 저장
    ├── 조회 → 변환 → 업데이트
    └── 복제 → 마운트 → 삭제
```

### Domain Scope/Boundary
- **Block**: 범용 블록 엔티티 관리 (생성, 조회, 업데이트, 삭제)
- **Block Type**: 블록 타입별 특화 데이터 및 검증 로직
- **Block Metadata**: 블록별 확장 가능한 속성 관리
- **Block Workspace**: 워크스페이스별 블록 스코프 및 권한 관리

### Business Rules/Policies
- **Block Uniqueness**: 워크스페이스 내 slug 유일성 보장
- **Block Type Validation**: 지원되는 블록 타입만 생성 허용
- **Block Metadata Schema**: 블록 타입별 metadata 스키마 검증
- **Workspace Isolation**: 워크스페이스 간 블록 격리 및 접근 제어

---

## 🟠 Domain Events (시간 순서)

### Block Creation & Management
- 블록이 생성되었다 (Block Created)
- 블록이 검증되었다 (Block Validated)
- 블록 메타데이터가 설정되었다 (Block Metadata Set)
- 블록 타입이 확인되었다 (Block Type Confirmed)

### Block Modification
- 블록 정보가 업데이트되었다 (Block Updated)
- 블록 메타데이터가 변경되었다 (Block Metadata Changed)
- 블록 슬러그가 변경되었다 (Block Slug Changed)


### Block Deletion & Cleanup
- 블록이 삭제되었다 (Block Deleted)
- 블록 관련 데이터가 정리되었다 (Block Data Cleaned)

---

## 🔵 Commands & Actors

### 주요 커맨드 목록

#### Scenario 1: Block Lifecycle Management
- **사용자가 블록 생성하기** (User) → [Block Created]
- **시스템이 블록 검증하기** (System) → [Block Validated]
- **사용자가 블록 정보 업데이트하기** (User) → [Block Updated]
- **사용자가 블록 삭제하기** (User) → [Block Deleted]

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **Content Creator**: 블록 생성 및 편집 담당
- **Canvas User**: 캔버스 내 블록 조작 및 마운트 관리

#### System Actors (내부 시스템)
- **Block Validation Service**: 블록 데이터 유효성 검증
- **Workspace Isolation Service**: 워크스페이스별 블록 격리 관리

#### External Systems (외부 도메인)
- **Canvas Management Domain**: 블록 테이블 직접 조회 (DB JOIN)
- **Workspace Management Domain**: 워크스페이스 권한 및 스코프 관리 (RLS 정책)

---

## 🟠 Bounded Context 정의

### Block Management Context (Main Context)
**책임**: 범용 블록 시스템의 생성, 조회, 수정, 삭제 및 Canvas Management Domain과의 인터페이스 제공

**핵심 언어**: Block, BlockType, Metadata, Workspace, Validation, Soft Delete

**핵심 용어 및 개념**:
- **Block**: 기본 콘텐츠 단위 (텍스트, 이미지, 페이지 등)
- **BlockType**: 블록의 종류 및 특성 (text, image, page, shape 등)
- **Metadata**: 블록별 확장 속성 및 설정 데이터
- **Workspace**: 블록의 스코프 및 접근 권한 경계
- **Validation**: 블록 데이터 유효성 검증
- **Soft Delete**: deleted_at 타임스탬프 기반 소프트 삭제

**포함 이벤트**:
- Block Creation & Management (4개 이벤트)
- Block Modification (3개 이벤트)
- Block Deletion & Cleanup (2개 이벤트)

---

## 🔗 Context 간 관계 및 통합점

### Block Management ↔ Canvas Management
- **연결점**: 캔버스에서 블록 정보 조회 필요
- **데이터 흐름**: 
  - `[Canvas가 블록 정보 조회]` → Canvas에서 blocks 테이블 직접 JOIN
  - `[Canvas가 블록 마운트]` → 블록 ID만 저장, 블록 정보는 JOIN으로 조회
- **통합 방식**: Canvas Management가 blocks 테이블 직접 조회 (DB JOIN)

### Block Management ↔ Workspace Management
- **연결점**: 워크스페이스별 블록 스코프 및 권한 관리
- **데이터 흐름**: 
  - `[Workspace Access Check]` → `[Block Workspace Validation]`
- **통합 방식**: RLS(Row Level Security) 정책 적용

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **Block Type Validation 일관성**
   - 문제: Canvas에서 사용할 블록 타입과 DB 스키마 간 불일치 가능성
   - 영향: 런타임 에러 및 데이터 무결성 문제
   - 해결: 블록 타입 enum과 validation 로직 표준화

2. **Canvas JOIN 성능**
   - 문제: Canvas에서 블록 정보 JOIN 시 성능 이슈 가능성
   - 영향: 캔버스 로딩 속도 저하
   - 해결: workspace_id, block_type, deleted_at 복합 인덱스 최적화

### 우선순위: 중간
3. **Metadata Schema 관리**
   - 문제: 블록 타입별 metadata 스키마 검증 로직 부재
   - 영향: 잘못된 metadata로 인한 렌더링 오류
   - 해결: 블록 타입별 metadata validator 구현

### 우선순위: 낮음
4. **Soft Delete 정리 전략**
   - 문제: 삭제된 블록이 계속 쌓여 스토리지 및 성능 이슈 가능성
   - 영향: 장기적인 스토리지 비용 증가
   - 해결: 주기적인 배치 작업으로 오래된 삭제 블록 완전 제거

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **Block 기본 CRUD**
   - 기회: 블록 생성, 수정, 삭제 기본 기능 제공
   - 구현: Block Manager를 통한 블록 생명주기 관리

2. **Canvas JOIN 최적화**
   - 기회: Canvas에서 효율적인 블록 정보 조회
   - 구현: workspace_id, block_type, deleted_at 복합 인덱스

3. **Block Type 및 Metadata 검증**
   - 기회: 블록 데이터 무결성 보장
   - 구현: 블록 타입별 validation 로직 및 metadata schema 검증

### 향후 구현 (Post-MVP)
4. **Block Versioning & History** *(메모)*
   - 블록 변경 이력 관리
   - 블록 버전별 롤백 기능

5. **Block Template & Preset** *(메모)*
   - 재사용 가능한 블록 템플릿 시스템
   - 블록 프리셋 및 기본값 관리

6. **Block 복제 기능** *(메모)*
   - Canvas에서 블록 복제 요청 처리
   - 메타데이터 및 속성 복사

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. Canvas Management 연동 처리 (핵심)
- Q: Canvas에서 블록 정보 JOIN 시 어떤 필드들이 필요한가? (block_type, metadata, 렌더링 속성 등)
- Q: Canvas 조회 성능을 위한 최적의 인덱스 전략은? (workspace_id + block_type + deleted_at)
- Q: 삭제된 블록이 Canvas에 마운트된 경우 어떻게 처리할 것인가?

### 2. Block Type 및 Metadata 관리 (핵심)
- Q: 지원되는 블록 타입 목록은 어떻게 관리할 것인가?
- Q: 블록 타입별 metadata 스키마는 어떻게 정의하고 검증할 것인가?
- Q: 새로운 블록 타입 추가 시 확장성은 어떻게 보장할 것인가?

### 3. Workspace Isolation 및 성능
- Q: 워크스페이스별 블록 격리는 RLS만으로 충분한가?
- Q: 블록 조회 성능 최적화를 위한 인덱스 전략은?
- Q: 소프트 삭제된 블록의 완전 삭제 주기는 얼마로 설정할 것인가?

### 4. Canvas 통합
- Q: Canvas에서 블록 정보를 실시간으로 JOIN 조회할 것인가, 캐싱할 것인가?
- Q: Block 생성/수정/삭제 시 Canvas에서 어떻게 반영할 것인가?
- Q: 블록이 삭제되었을 때 Canvas 마운트를 자동으로 해제할 것인가?

---

## 📝 Process Model 준비 상태

Block Management Domain의 핵심 이벤트와 Canvas Management 연동 요구사항이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 블록 생성, 수정, 삭제 커맨드 정의
2. **Policy** 정의: 블록 타입 검증 규칙, 워크스페이스 격리 정책, 소프트 삭제 규칙
3. **Read Model** 명시: Canvas JOIN을 위한 블록 정보 구조
4. **External System**: Canvas Management Domain과의 DB JOIN 통합 방식

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025-01-27 (Canvas Management 연동 요구사항 분석)
**참가자**: 
- **시니어 개발자**: AI Assistant (도메인 설계 및 연동 인터페이스 분석)
- **주니어 개발자**: AI Assistant (Canvas Management 요구사항 분석)

**워크샵 결과물**:
- [x] Canvas Management 연동을 위한 핵심 이벤트 목록 완성
- [x] BlockDomainService 인터페이스 요구사항 식별 완료
- [x] Bounded Context 경계 정의 완료 (Block Management 단일 Context)
- [x] Canvas Management와의 통합점 및 데이터 흐름 정리 완료
- [x] 최소 구현 범위 및 우선순위 정리 완료

---

## 🔗 연관 도메인

### Canvas Management Domain과의 관계
- **연결점**: 캔버스에서 블록 정보 조회를 위한 DB 연동
- **데이터 흐름**: Canvas Management → Block Management (blocks 테이블 직접 JOIN)
- **통합 방식**: 
  - Canvas에서 blocks 테이블 직접 조회 (DB JOIN)
  - 공통 RLS 정책으로 워크스페이스 격리
  - deleted_at IS NULL 조건으로 삭제 블록 필터링

### Workspace Management Domain과의 관계  
- **연결점**: 워크스페이스별 블록 스코프 및 접근 권한 관리
- **데이터 흐름**: Workspace Management → Block Management (RLS 정책 적용)
- **통합 방식**: 
  - RLS 정책: 워크스페이스별 블록 접근 제어
  - 권한 검증: 워크스페이스 멤버십 기반 블록 접근 관리

---

*이 Event Storming 문서는 Canvas Management Domain 구현을 위한 Block Management Domain의 최소 요구사항을 정의합니다.*
