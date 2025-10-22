# Technical Specification: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-10-19  
**버전**: v1.0

**Testing Strategy 참조**: `04-testing-strategy.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: `07-tdd-implementation.md` (실제 구현)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-technical-specification-guide.md`  
> **작성 시점**: Software Design 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

Canvas Management Domain은 **단일 Bounded Context**로 구성되어 있으며, 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구를 제공하는 핵심 도메인입니다.

**핵심 구현 전략**:
- 3개 핵심 Aggregate: BlockMount, Edge, Viewport
- Read Model Service: 페이지별 캔버스 데이터 조회 (블럭 마운트 + 엣지 + 뷰포트)
- React Flow ACL을 통한 외부 라이브러리 통합
- State of Truth 전략: React Flow State (단기) + Database (장기)
- Workspace Management, Block Domain과의 동기적 서비스 주입

### Testing Strategy 연결점

- **입력**: `04-testing-strategy.md` - 주요 테스트 케이스 N개
- **입력**: `03-software-design.md` - 3개 핵심 Aggregate (BlockMount, Edge, Viewport) + Read Model
- **출력**: 구현 수도코드 + 테스트 수도코드

### TDD 구현 순서 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 5개 (Position, Size, ZOrder, BlockMountId, EdgeId)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 3개 (BlockMount, Edge, Viewport)
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 3개 (BlockMount, Edge, Viewport)
Phase 4: Repository (⭐️⭐️⭐️⭐️) - 3개 (BlockMount, Edge, Viewport Repository)
Phase 5: Read Model (⭐️⭐️⭐️⭐️) - 1개 (CanvasView Query)
Phase 6: Service (⭐️⭐️⭐️⭐️) - 1개 (CanvasManagementService)
Phase 7: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 8개 (캔버스 데이터 조회, 블럭 생성/변환/삭제, 엣지 관리 등)
Phase 8: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 9개 (각 시나리오별)
```

---

## 🧩 DDD Components

> **가이드 참조**: Phase 2.2 - DDD 컴포넌트 수도코드 작성

### 1. Value Objects 수도코드

#### Position VO

- **파일 위치**: `src/domains/canvas-management/shared/value-objects/position.vo.ts`
- **역할**: Position의 유효성을 검증하고 좌표 도메인 로직을 캡슐화
- **주요 기능**:
  - x, y 좌표 값 유효성 검사 (범위: -999999부터 999999까지)
  - 좌표 계산 메서드 (이동, 거리 계산)
  - 다른 Position 객체와의 동등성 비교
  - 스냅 계산을 위한 가이드라인 위치 계산
- **에러 처리**: 잘못된 좌표 범위 시 CanvasManagementError 발생
- **비즈니스 규칙**: 캔버스 좌표는 유한 범위 내에서만 유효

```typescript
class Position {
  private readonly x: number;
  private readonly y: number;
  
  constructor(x: number, y: number) {
    // 1. x, y 값이 숫자인지 검증
    // 2. 좌표 범위 검증 (-999999 <= x, y <= 999999)
    // 3. Infinity, NaN 체크
    // 4. this.x, this.y 할당
  }
  
  equals(other: Position): boolean {
    // 1. null/undefined 체크
    // 2. x, y 값 비교 (부동소수점 오차 고려)
    // 3. boolean 반환
  }
  
  add(offset: Position): Position {
    // 1. 새로운 x, y 계산
    // 2. 새로운 Position 인스턴스 반환
  }
  
  distanceTo(other: Position): number {
    // 1. 거리 공식 적용
    // 2. 결과 반환
  }
}
```

**기본 테스트 수도코드**:
```typescript
describe('Position', () => {
  // Given: 유효한 좌표값들
  // When: Position 생성
  // Then: 정상적으로 생성됨
  
  // Given: 범위를 벗어난 좌표값
  // When: Position 생성 시도
  // Then: CanvasManagementError 발생
});
```

**사용 시나리오**:
- 블럭 위치 설정 시 즉시 검증
- 드래그 이동 시 좌표 계산 및 검증
- 스냅 가이드라인 계산 시 정확한 좌표 비교

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### Size VO

- **파일 위치**: `src/domains/canvas-management/shared/value-objects/size.vo.ts`
- **역할**: Size의 유효성을 검증하고 크기 도메인 로직을 캡슐화
- **주요 기능**:
  - width, height 값 유효성 검사 (범위: 1부터 10000까지)
  - 최소/최대 크기 제한 검증
  - 다른 Size 객체와의 동등성 비교
  - 크기 계산 메서드 (리사이즈, 비율 계산)
- **에러 처리**: 잘못된 크기 범위 시 CanvasManagementError 발생
- **비즈니스 규칙**: 블럭 크기는 양수이며 합리적인 범위 내에서만 유효

```typescript
class Size {
  private readonly width: number;
  private readonly height: number;
  
  constructor(width: number, height: number) {
    // 1. width, height 값이 숫자인지 검증
    // 2. 크기 범위 검증 (1 <= width, height <= 10000)
    // 3. 최소 크기 보장 (최소 10px)
    // 4. this.width, this.height 할당
  }
  
  equals(other: Size): boolean {
    // 1. null/undefined 체크
    // 2. width, height 값 비교
    // 3. boolean 반환
  }
  
  resize(newWidth: number, newHeight: number): Size {
    // 1. 새 크기로 검증된 Size 인스턴스 생성
    // 2. 반환
  }
  
  getArea(): number {
    // 1. width * height 계산
    // 2. 결과 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### ZOrder VO

- **파일 위치**: `src/domains/canvas-management/shared/value-objects/z-order.vo.ts`
- **역할**: ZOrder의 유효성을 검증하고 z-order 도메인 로직을 캡슐화
- **주요 기능**:
  - z-order 값 유효성 검사 (범위: 0부터 2147483647까지)
  - 정수값 검증
  - 다른 ZOrder 객체와의 비교 (위/아래 레이어)
- **에러 처리**: 잘못된 z-order 값 시 CanvasManagementError 발생
- **비즈니스 규칙**: z-order는 정수이며 최상위 레이어로 설정 가능

```typescript
class ZOrder {
  private readonly value: number;
  
  constructor(value: number) {
    // 1. 값이 정수인지 검증
    // 2. z-order 범위 검증 (0 <= value <= 2147483647)
    // 3. this.value 할당
  }
  
  equals(other: ZOrder): boolean {
    // 1. null/undefined 체크
    // 2. value 비교
    // 3. boolean 반환
  }
  
  isAbove(other: ZOrder): boolean {
    // 1. this.value > other.value 비교
    // 2. boolean 반환
  }
  
  static getTopLayer(): ZOrder {
    // 1. 최상위 레이어 값 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### BlockMountId VO

- **파일 위치**: `src/domains/canvas-management/shared/value-objects/block-mount-id.vo.ts`
- **역할**: BlockMountId의 유효성을 검증하고 블럭 마운트 식별자 도메인 로직을 캡슐화
- **주요 기능**:
  - 복합 식별자 형식 검증 (PageId + BlockId)
  - 다른 BlockMountId 객체와의 동등성 비교
- **에러 처리**: 잘못된 복합 식별자 형식 시 CanvasManagementError 발생
- **비즈니스 규칙**: BlockMountId는 PageId와 BlockId의 조합으로 구성

```typescript
class BlockMountId {
  private readonly pageId: PageId;
  private readonly blockId: BlockId;
  private readonly value: string;
  
  constructor(pageId: PageId, blockId: BlockId) {
    // 1. pageId, blockId 유효성 검증
    // 2. 복합 식별자 생성 (예: "${pageId}:${blockId}")
    // 3. this.pageId, this.blockId, this.value 할당
  }
  
  equals(other: BlockMountId): boolean {
    // 1. null/undefined 체크
    // 2. pageId, blockId 비교
    // 3. boolean 반환
  }
  
  getPageId(): PageId {
    // 1. pageId 반환
  }
  
  getBlockId(): BlockId {
    // 1. blockId 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### EdgeId VO

- **파일 위치**: `src/domains/canvas-management/shared/value-objects/edge-id.vo.ts`
- **역할**: EdgeId의 유효성을 검증하고 엣지 식별자 도메인 로직을 캡슐화
- **주요 기능**:
  - UUID 형식 검증
  - 다른 EdgeId 객체와의 동등성 비교
- **에러 처리**: 잘못된 UUID 형식 시 CanvasManagementError 발생
- **비즈니스 규칙**: EdgeId는 페이지별로 유일한 유효한 UUID

```typescript
class EdgeId {
  private readonly value: string;
  
  constructor(value: string) {
    // 1. 빈 값 검증
    // 2. UUID 형식 검증 (정규식)
    // 3. this.value 할당
  }
  
  equals(other: EdgeId): boolean {
    // 1. null/undefined 체크
    // 2. value 비교
    // 3. boolean 반환
  }
  
  static generate(): EdgeId {
    // 1. 새로운 UUID 생성
    // 2. 새로운 EdgeId 인스턴스 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

### 2. Entities 수도코드

#### BlockMount Entity

- **파일 위치**: `src/domains/canvas-management/shared/entities/block-mount.entity.ts`
- **역할**: BlockMount 도메인 엔티티로 블럭 마운팅의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: BlockMountId Value Object로 고유 식별자
  - pageId: PageId (불변)
  - blockId: BlockId (불변)
  - position: Position VO (변경 가능)
  - size: Size VO (변경 가능)
  - zOrder: ZOrder VO (변경 가능)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - transform(newPosition?: Position, newSize?: Size, newZOrder?: ZOrder): 블럭 변형
  - canBeDeleted(): 삭제 가능 여부 확인
- **비즈니스 규칙**: 속성 변경 시 updatedAt 자동 갱신, 하나 이상의 페이지에 마운트되어야 함

```typescript
class BlockMount {
  constructor(
    public readonly id: BlockMountId,
    public readonly pageId: PageId,
    public readonly blockId: BlockId,
    public position: Position,
    public size: Size,
    public zOrder: ZOrder,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
  
  transform(newPosition?: Position, newSize?: Size, newZOrder?: ZOrder): void {
    // 1. 각 속성이 제공된 경우 업데이트
    // 2. position, size, zOrder 업데이트
    // 3. updatedAt 갱신
  }
  
  canBeDeleted(): boolean {
    // 1. 삭제 가능 조건 확인
    // 2. boolean 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Entities 테스트 케이스

---

#### Edge Entity

- **파일 위치**: `src/domains/canvas-management/shared/entities/edge.entity.ts`
- **역할**: Edge 도메인 엔티티로 엣지 연결의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: EdgeId Value Object로 고유 식별자
  - pageId: PageId (불변)
  - sourceBlockId: BlockId (불변)
  - targetBlockId: BlockId (불변)
  - edgeType: EdgeType VO (변경 가능)
  - edgeLabel: string (변경 가능)
  - edgeStyle: EdgeStyle VO (변경 가능)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateType(newType: EdgeType): 엣지 타입 변경
  - updateLabel(newLabel: string): 엣지 레이블 변경
  - updateStyle(newStyle: EdgeStyle): 엣지 스타일 변경
  - isSelfLoop(): self-loop 여부 확인
- **비즈니스 규칙**: 속성 변경 시 updatedAt 자동 갱신, 특정 페이지에서만 존재

```typescript
class Edge {
  constructor(
    public readonly id: EdgeId,
    public readonly pageId: PageId,
    public readonly sourceBlockId: BlockId,
    public readonly targetBlockId: BlockId,
    public edgeType: EdgeType,
    public edgeLabel: string = '',
    public edgeStyle: EdgeStyle,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
  
  updateType(newType: EdgeType): void {
    // 1. edgeType 업데이트
    // 2. updatedAt 갱신
  }
  
  updateLabel(newLabel: string): void {
    // 1. edgeLabel 업데이트
    // 2. updatedAt 갱신
  }
  
  updateStyle(newStyle: EdgeStyle): void {
    // 1. edgeStyle 업데이트
    // 2. updatedAt 갱신
  }
  
  isSelfLoop(): boolean {
    // 1. sourceBlockId === targetBlockId 비교
    // 2. boolean 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Entities 테스트 케이스

---

#### Viewport Entity

- **파일 위치**: `src/domains/canvas-management/shared/entities/viewport.entity.ts`
- **역할**: Viewport 도메인 엔티티로 뷰포트의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: ViewportId Value Object로 고유 식별자
  - pageId: PageId (불변)
  - zoomLevel: ZoomLevel VO (변경 가능)
  - center: ViewportCenter VO (변경 가능)
  - lastSaved: 마지막 저장 시각 (변경 가능)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateViewport(newZoomLevel: ZoomLevel, newCenter: ViewportCenter): 뷰포트 업데이트
  - saveState(): 뷰포트 상태 저장
  - restoreState(savedZoomLevel: ZoomLevel, savedCenter: ViewportCenter): 뷰포트 상태 복원
- **비즈니스 규칙**: 속성 변경 시 updatedAt 자동 갱신, 페이지별로 하나의 뷰포트만 존재

```typescript
class Viewport {
  constructor(
    public readonly id: ViewportId,
    public readonly pageId: PageId,
    public zoomLevel: ZoomLevel,
    public center: ViewportCenter,
    public lastSaved: Date | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
  
  updateViewport(newZoomLevel: ZoomLevel, newCenter: ViewportCenter): void {
    // 1. zoomLevel, center 업데이트
    // 2. updatedAt 갱신
  }
  
  saveState(): void {
    // 1. lastSaved를 현재 시각으로 설정
    // 2. updatedAt 갱신
  }
  
  restoreState(savedZoomLevel: ZoomLevel, savedCenter: ViewportCenter): void {
    // 1. zoomLevel, center 복원
    // 2. updatedAt 갱신
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Entities 테스트 케이스

---

### 3. Aggregates 수도코드

#### BlockMount Aggregate

- **파일 위치**: `src/domains/canvas-management/shared/aggregates/block-mount.aggregate.ts`
- **역할**: BlockMount 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - BlockMount 생성 시 모든 관련 객체 동시 생성
  - 블럭 위치, 크기, Z-Order 개별 업데이트
  - 도메인 이벤트 발생 및 관리
  - 관련 엔티티들의 일관성 보장
- **주요 메서드**:
  - mountBlock(): 블럭 마운트 및 BlockMounted 발행
  - updateBlockPosition(): 블럭 위치 업데이트 및 BlockPositionUpdated 발행
  - updateBlockSize(): 블럭 크기 업데이트 및 BlockSizeUpdated 발행
  - updateBlockZOrder(): 블럭 Z-Order 업데이트 및 BlockZOrderUpdated 발행
  - mountDuplicatedBlock(): 복제된 블럭 마운트 및 DuplicatedBlockMounted 발행
  - deleteBlockMount(): 블럭 마운트 해제 및 BlockMountDeleted 발행
- **비즈니스 로직**: 새로 생성된 블럭은 최상위 z-order에 배치되며, 드래그/리사이즈 종료 시에만 DB 저장
- **불변식(Invariants)**:
  - 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
  - 하나의 블럭은 여러 페이지에 마운트 가능하지만, 같은 페이지에는 한 번만 마운트 가능
  - 블럭 복제 시 완전히 새로운 블럭 생성 + 새로운 마운트 관계 생성
  - 새로 생성된 블럭은 최상위 z-order에 배치됨
  - 다중 선택 시 상대적 순서 유지

```typescript
class BlockMountAggregate {
  private _blockMount: BlockMount;
  private _events: DomainEvent[] = [];
  
  static mountBlock(
    pageId: PageId, 
    blockId: BlockId, 
    position: Position, 
    size: Size
  ): BlockMountAggregate {
    // 1. BlockMountId 생성
    // 2. 최상위 ZOrder 계산 (현재 최대값 + 1)
    // 3. BlockMount Entity 생성
    // 4. BlockMounted 이벤트 생성
    // 5. 이벤트 추가
    // 6. BlockMountAggregate 반환
  }
  
  updateBlockPosition(newPosition: Position): BlockPositionUpdatedEvent {
    // 1. BlockMount Entity 위치 업데이트
    // 2. BlockPositionUpdated 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  updateBlockSize(newSize: Size): BlockSizeUpdatedEvent {
    // 1. BlockMount Entity 크기 업데이트
    // 2. BlockSizeUpdated 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  updateBlockZOrder(newZOrder: ZOrder): BlockZOrderUpdatedEvent {
    // 1. BlockMount Entity Z-Order 업데이트
    // 2. BlockZOrderUpdated 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  static mountDuplicatedBlock(
    originalBlockId: BlockId,
    newBlockId: BlockId,
    pageId: PageId,
    position: Position,
    size: Size
  ): BlockMountAggregate {
    // 1. BlockMountId 생성 (newBlockId 기반)
    // 2. 최상위 ZOrder 계산
    // 3. BlockMount Entity 생성
    // 4. DuplicatedBlockMounted 이벤트 생성
    // 5. 이벤트 추가
    // 6. BlockMountAggregate 반환
  }
  
  deleteBlockMount(): BlockMountDeletedEvent {
    // 1. 삭제 가능 여부 확인
    // 2. BlockMountDeleted 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  getUncommittedEvents(): DomainEvent[] {
    // 1. 발행된 이벤트 목록 반환
  }
}
```

**사용 시나리오**:
- 블럭 마운트 시 모든 관련 객체 동시 생성
- 블럭 변형 시 비즈니스 규칙 검증
- 생성된 모든 이벤트를 한 번에 반환

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 1, 2, 3, 5, 8

---

#### Edge Aggregate

- **파일 위치**: `src/domains/canvas-management/shared/aggregates/edge.aggregate.ts`
- **역할**: Edge 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - Edge 생성 시 모든 관련 객체 동시 생성
  - 엣지 관리 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - 관련 엔티티들의 일관성 보장
- **주요 메서드**:
  - createEdge(): 엣지 생성 및 EdgeCreated 발행
  - updateEdgeType(): 엣지 타입 변경 및 EdgeTypeChanged 발행
  - updateEdgeLabel(): 엣지 레이블 변경 및 EdgeLabelChanged 발행
  - updateEdgeStyle(): 엣지 스타일 변경 및 EdgeStyleChanged 발행
  - deleteEdge(): 엣지 삭제 및 EdgeDeleted 발행
- **비즈니스 로직**: 엣지는 특정 페이지에서만 존재하며, 블럭 삭제 시 연결된 모든 엣지 자동 삭제
- **불변식(Invariants)**:
  - 엣지는 특정 페이지에서만 존재함
  - 자기 자신으로의 엣지(self-loop) 허용
  - 엣지 타입은 지원되는 형식만 허용

```typescript
class EdgeAggregate {
  private _edge: Edge;
  private _events: DomainEvent[] = [];
  
  static createEdge(
    pageId: PageId,
    sourceBlockId: BlockId, 
    targetBlockId: BlockId, 
    edgeType?: EdgeType
  ): EdgeAggregate {
    // 1. EdgeId 생성
    // 2. Edge Entity 생성 (기본 EdgeType, EdgeStyle 적용)
    // 3. EdgeCreated 이벤트 생성
    // 4. 이벤트 추가
    // 5. EdgeAggregate 반환
  }
  
  updateEdgeType(newType: EdgeType): EdgeTypeChangedEvent {
    // 1. 유효한 EdgeType 확인
    // 2. Edge Entity 타입 업데이트
    // 3. EdgeTypeChanged 이벤트 생성
    // 4. 이벤트 추가
    // 5. 이벤트 반환
  }
  
  updateEdgeLabel(newLabel: string): EdgeLabelChangedEvent {
    // 1. Edge Entity 레이블 업데이트
    // 2. EdgeLabelChanged 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  deleteEdge(): EdgeDeletedEvent {
    // 1. EdgeDeleted 이벤트 생성
    // 2. 이벤트 추가
    // 3. 이벤트 반환
  }
  
  static deleteConnectedEdges(
    pageId: PageId, 
    blockId: BlockId
  ): ConnectedEdgesDeletedEvent {
    // 1. 연결된 모든 엣지 조회
    // 2. ConnectedEdgesDeleted 이벤트 생성
    // 3. 이벤트 반환
  }
  
  getUncommittedEvents(): DomainEvent[] {
    // 1. 발행된 이벤트 목록 반환
  }
}
```

**사용 시나리오**:
- 엣지 생성 시 모든 관련 객체 동시 생성
- 엣지 수정 시 비즈니스 규칙 검증
- 블럭 삭제 시 연결된 엣지 일괄 삭제

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 7, 8

---

#### Viewport Aggregate

- **파일 위치**: `src/domains/canvas-management/shared/aggregates/viewport.aggregate.ts`
- **역할**: Viewport 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - Viewport 생성 시 모든 관련 객체 동시 생성
  - 뷰포트 관리 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - 관련 엔티티들의 일관성 보장
- **주요 메서드**:
  - updateViewport(): 뷰포트 업데이트 및 ViewportUpdated 발행
  - saveViewportState(): 뷰포트 상태 저장 및 ViewportStateSaved 발행
  - restoreViewportState(): 뷰포트 상태 복원 및 ViewportStateRestored 발행
- **비즈니스 로직**: 줌 레벨은 최소/최대 제한 범위 내에서만 가능하며, 페이지 이탈 시에만 자동 저장
- **불변식(Invariants)**:
  - 줌 레벨은 최소/최대 제한 범위 내에서만 가능
  - 페이지 이탈 시에만 뷰포트 상태 자동 저장
  - 페이지 재진입 시 이전 뷰포트 상태 자동 복원
  - React Flow 애니메이션을 통한 부드러운 전환 보장

```typescript
class ViewportAggregate {
  private _viewport: Viewport;
  private _events: DomainEvent[] = [];
  
  static create(pageId: PageId): ViewportAggregate {
    // 1. ViewportId 생성 (PageId 기반)
    // 2. 기본 ZoomLevel, ViewportCenter 설정
    // 3. Viewport Entity 생성
    // 4. ViewportAggregate 반환
  }
  
  updateViewport(
    zoomLevel: ZoomLevel, 
    center: ViewportCenter
  ): ViewportUpdatedEvent {
    // 1. 줌 레벨 제한 확인 (최소/최대 범위)
    // 2. Viewport Entity 업데이트
    // 3. ViewportUpdated 이벤트 생성
    // 4. 이벤트 추가
    // 5. 이벤트 반환
  }
  
  saveViewportState(): ViewportStateSavedEvent {
    // 1. Viewport Entity 상태 저장
    // 2. ViewportStateSaved 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  restoreViewportState(
    savedZoomLevel: ZoomLevel, 
    savedCenter: ViewportCenter
  ): ViewportStateRestoredEvent {
    // 1. Viewport Entity 상태 복원
    // 2. ViewportStateRestored 이벤트 생성
    // 3. 이벤트 추가
    // 4. 이벤트 반환
  }
  
  getUncommittedEvents(): DomainEvent[] {
    // 1. 발행된 이벤트 목록 반환
  }
}
```

**사용 시나리오**:
- 뷰포트 생성 시 모든 관련 객체 동시 생성
- 뷰포트 변경 시 비즈니스 규칙 검증
- 상태 저장/복원 시 일관성 보장

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 9

---

### 4. Commands & Events 수도코드

#### LoadCanvasDataCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 캔버스 데이터 로드 의도를 표현하는 Command 객체
- **주요 속성**:
  - pageId: PageId (필수, 유효한 UUID 형식)
  - userId: UserId (필수, 사용자 인증 확인)
- **검증 규칙**:
  - pageId는 유효한 UUID 형식이어야 함
  - userId는 인증된 사용자여야 함
- **특징**: 페이지 접근 시 캔버스 전체 상태를 로드

```typescript
interface LoadCanvasDataCommand {
  pageId: PageId;
  userId: UserId;
}
```

**사용 시나리오**:
- Server Actions에서 사용자 입력을 Command로 변환
- Aggregate 실행 전 입력값 검증
- 페이지 접근 권한 확인

---

#### MountBlockCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 블럭 마운트 의도를 표현하는 Command 객체
- **주요 속성**:
  - pageId: PageId (필수)
  - blockId: BlockId (필수)
  - position: Position (필수, 유효한 좌표 범위)
  - size: Size (필수, 유효한 크기 범위)
- **검증 규칙**:
  - position은 유효한 좌표 범위 내여야 함
  - size는 최소/최대 크기 제한을 준수해야 함
- **특징**: Block Domain과의 협력을 위한 블럭 ID 포함

```typescript
interface MountBlockCommand {
  pageId: PageId;
  blockId: BlockId;
  position: Position;
  size: Size;
}
```

---

#### UpdateBlockPositionCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 블럭 위치 업데이트 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockMountId: BlockMountId (필수)
  - newPosition: Position (필수)
  - userId: UserId (필수, 사용자 인증)
- **검증 규칙**:
  - newPosition은 유효한 좌표 범위 내여야 함
- **특징**: 드래그 종료 시 위치만 업데이트

```typescript
interface UpdateBlockPositionCommand {
  blockMountId: BlockMountId;
  newPosition: Position;
  userId: UserId;
}
```

---

#### UpdateBlockSizeCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 블럭 크기 업데이트 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockMountId: BlockMountId (필수)
  - newSize: Size (필수)
  - userId: UserId (필수, 사용자 인증)
- **검증 규칙**:
  - newSize는 최소/최대 크기 제한 준수
- **특징**: 리사이즈 종료 시 크기만 업데이트

```typescript
interface UpdateBlockSizeCommand {
  blockMountId: BlockMountId;
  newSize: Size;
  userId: UserId;
}
```

---

#### UpdateBlockZOrderCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 블럭 Z-Order 업데이트 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockMountId: BlockMountId (필수)
  - newZOrder: ZOrder (필수)
  - userId: UserId (필수, 사용자 인증)
- **검증 규칙**:
  - newZOrder는 유효한 범위 내여야 함
- **특징**: 레이어 순서 변경 시 사용

```typescript
interface UpdateBlockZOrderCommand {
  blockMountId: BlockMountId;
  newZOrder: ZOrder;
  userId: UserId;
}
```

---

#### UpdateMultipleBlockPositionsCommand

- **파일 위치**: `src/domains/canvas-management/shared/commands/index.ts`
- **역할**: 다중 블럭 위치 일괄 업데이트 의도를 표현하는 Command 객체
- **주요 속성**:
  - blockPositions: Array<{blockMountId: BlockMountId, position: Position}> (필수)
  - userId: UserId (필수, 사용자 인증)
- **검증 규칙**:
  - 모든 position은 유효한 좌표 범위 내여야 함
- **특징**: 정렬/분포 후 프론트엔드에서 계산된 위치값을 일괄 업데이트

```typescript
interface UpdateMultipleBlockPositionsCommand {
  blockPositions: Array<{blockMountId: BlockMountId, position: Position}>;
  userId: UserId;
}
```

---

#### CanvasDataLoadedEvent

- **파일 위치**: `src/domains/canvas-management/shared/events/index.ts`
- **역할**: 캔버스 데이터 로드 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('CanvasDataLoaded')
  - aggregateId: 이벤트를 발생시킨 Canvas Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - pageId: PageId - 로드된 페이지 ID
  - blockCount: number - 로드된 블럭 개수
  - edgeCount: number - 로드된 엣지 개수
  - occurredAt: Date - 발생 시각
- **특징**: 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

```typescript
class CanvasDataLoadedEvent implements DomainEvent {
  readonly type = 'CanvasDataLoaded';
  
  constructor(
    public readonly aggregateId: PageId,
    public readonly data: {
      pageId: PageId;
      blockCount: number;
      edgeCount: number;
      occurredAt: Date;
    }
  ) {}
}
```

**사용 시나리오**:
- 캔버스 데이터 로드 완료 시 Frontend에 알림
- 빈 페이지와 기존 페이지 모두 동일한 이벤트 발행

---

#### BlockPositionUpdatedEvent

- **파일 위치**: `src/domains/canvas-management/shared/events/index.ts`
- **역할**: 블럭 위치 업데이트 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('BlockPositionUpdated')
  - aggregateId: 이벤트를 발생시킨 BlockMount Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - blockMountId: BlockMountId - 업데이트된 블럭 마운트 ID
  - newPosition: Position - 새 위치
  - occurredAt: Date - 발생 시각
- **특징**: 드래그 종료 시 발행

```typescript
class BlockPositionUpdatedEvent implements DomainEvent {
  readonly type = 'BlockPositionUpdated';
  
  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newPosition: Position;
      occurredAt: Date;
    }
  ) {}
}
```

**사용 시나리오**:
- 드래그 종료 시 Frontend에 알림
- React Flow State 업데이트

---

#### BlockSizeUpdatedEvent

- **파일 위치**: `src/domains/canvas-management/shared/events/index.ts`
- **역할**: 블럭 크기 업데이트 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('BlockSizeUpdated')
  - aggregateId: 이벤트를 발생시킨 BlockMount Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - blockMountId: BlockMountId - 업데이트된 블럭 마운트 ID
  - newSize: Size - 새 크기
  - occurredAt: Date - 발생 시각
- **특징**: 리사이즈 종료 시 발행

```typescript
class BlockSizeUpdatedEvent implements DomainEvent {
  readonly type = 'BlockSizeUpdated';
  
  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newSize: Size;
      occurredAt: Date;
    }
  ) {}
}
```

**사용 시나리오**:
- 리사이즈 종료 시 Frontend에 알림
- React Flow State 업데이트

---

#### BlockZOrderUpdatedEvent

- **파일 위치**: `src/domains/canvas-management/shared/events/index.ts`
- **역할**: 블럭 Z-Order 업데이트 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('BlockZOrderUpdated')
  - aggregateId: 이벤트를 발생시킨 BlockMount Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - blockMountId: BlockMountId - 업데이트된 블럭 마운트 ID
  - newZOrder: ZOrder - 새 Z-Order
  - occurredAt: Date - 발생 시각
- **특징**: 레이어 순서 변경 시 발행

```typescript
class BlockZOrderUpdatedEvent implements DomainEvent {
  readonly type = 'BlockZOrderUpdated';
  
  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newZOrder: ZOrder;
      occurredAt: Date;
    }
  ) {}
}
```

**사용 시나리오**:
- 레이어 순서 변경 시 Frontend에 알림
- React Flow State 업데이트

---

#### BlockMountedEvent

- **파일 위치**: `src/domains/canvas-management/shared/events/index.ts`
- **역할**: 블럭 마운트 완료를 알리는 도메인 이벤트
- **주요 속성**:
  - type: 이벤트 타입 ('BlockMounted')
  - aggregateId: 이벤트를 발생시킨 BlockMount Aggregate ID
  - data: 이벤트 데이터
- **이벤트 데이터**:
  - blockMountId: BlockMountId - 생성된 블럭 마운트 ID
  - pageId: PageId - 마운트된 페이지 ID
  - blockId: BlockId - 마운트된 블럭 ID
  - position: Position - 초기 위치
  - size: Size - 초기 크기
  - zOrder: ZOrder - 할당된 z-order
  - occurredAt: Date - 발생 시각
- **특징**: 블럭 생성 완료 시점을 명확히 기록

```typescript
class BlockMountedEvent implements DomainEvent {
  readonly type = 'BlockMounted';
  
  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      pageId: PageId;
      blockId: BlockId;
      position: Position;
      size: Size;
      zOrder: ZOrder;
      occurredAt: Date;
    }
  ) {}
}
```

**사용 시나리오**:
- 블럭 생성 완료 시 Frontend에 알림
- React Flow State 업데이트
- 블럭 목록 UI 갱신

---

### 5. Error Types 수도코드

#### CanvasManagementError 클래스

- **파일 위치**: `src/domains/canvas-management/shared/errors/canvas-management.error.ts`
- **역할**: Canvas Management 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (CanvasManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

```typescript
class CanvasManagementError extends Error {
  constructor(
    public readonly code: CanvasManagementErrorCode,
    public readonly message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CanvasManagementError';
  }
}
```

#### CanvasManagementErrorCode 타입

- **역할**: Canvas Management 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - INVALID_POSITION: 좌표 범위를 벗어난 경우
  - INVALID_SIZE: 크기 범위를 벗어난 경우
  - INVALID_ZORDER: z-order 값이 유효하지 않은 경우
  - BLOCK_NOT_FOUND: 블럭을 찾을 수 없는 경우
  - CANVAS_NOT_INITIALIZED: 캔버스가 초기화되지 않은 경우
  - EDGE_CONNECTION_FAILED: 엣지 연결에 실패한 경우
  - VIEWPORT_LIMIT_EXCEEDED: 뷰포트 제한을 초과한 경우
  - UNAUTHORIZED_ACCESS: 권한 부족 시
  - DATABASE_CONNECTION_FAILED: 데이터베이스 연결 실패 시

```typescript
type CanvasManagementErrorCode = 
  | 'INVALID_POSITION'
  | 'INVALID_SIZE'
  | 'INVALID_ZORDER'
  | 'BLOCK_NOT_FOUND'
  | 'CANVAS_NOT_INITIALIZED'
  | 'EDGE_CONNECTION_FAILED'
  | 'VIEWPORT_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATABASE_CONNECTION_FAILED';
```

#### 에러 메시지 매핑

- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

```typescript
const ERROR_MESSAGES: Record<CanvasManagementErrorCode, string> = {
  INVALID_POSITION: '좌표 값이 유효하지 않습니다.',
  INVALID_SIZE: '블럭 크기가 유효하지 않습니다.',
  INVALID_ZORDER: 'z-order 값이 유효하지 않습니다.',
  BLOCK_NOT_FOUND: '블럭을 찾을 수 없습니다.',
  CANVAS_NOT_INITIALIZED: '캔버스가 초기화되지 않았습니다.',
  EDGE_CONNECTION_FAILED: '엣지 연결에 실패했습니다.',
  VIEWPORT_LIMIT_EXCEEDED: '뷰포트 제한을 초과했습니다.',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다.',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.'
};
```

**사용 시나리오**:
- 비즈니스 규칙 위반 시 사용자에게 친화적 메시지
- 시스템 에러 발생 시 로그 기록
- 권한 부족 시 적절한 에러 코드 반환

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Error Types 테스트 케이스

---

## 🔧 Infrastructure Layer

> **가이드 참조**: Phase 2.3 - Service/Repository/ACL 수도코드 작성

### 1. Read Model 수도코드

#### CanvasView Query

- **파일 위치**: `src/domains/canvas-management/application/queries/get-canvas-view.query.ts`
- **역할**: 페이지별 캔버스 전체 데이터를 조회하는 Read Model Query
- **주요 기능**:
  - 페이지 접근 권한 확인
  - BlockMount, Edge, Viewport 데이터 조회
  - Block Domain Service와 DB JOIN으로 블럭 정보 조회
  - React Flow 형식으로 변환
- **Return Type**: `CanvasView` DTO

```typescript
interface CanvasView {
  pageId: string;
  blocks: Array<{
    blockMountId: string;
    blockId: string;
    blockType: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zOrder: number;
    content: any; // 블럭별 컨텐츠
  }>;
  edges: Array<{
    edgeId: string;
    sourceBlockId: string;
    targetBlockId: string;
    edgeType: string;
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

class GetCanvasViewQuery {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository,
    private blockDomainService: BlockDomainService,
    private workspaceRepository: WorkspaceRepository
  ) {}
  
  async execute(pageId: PageId, userId: UserId): Promise<Result<CanvasView, Error>> {
    // 1. 페이지 접근 권한 확인 (WorkspaceRepository)
    // 2. BlockMountRepository.findByPageId() - z-order 정렬
    // 3. EdgeRepository.findByPageId()
    // 4. ViewportRepository.findByPageId()
    // 5. BlockDomainService.getBlocksByIds() - 배치 조회 (DB JOIN)
    // 6. 모든 데이터 조합하여 CanvasView 생성
    // 7. Result<CanvasView, Error> 반환
  }
}
```

**사용 시나리오**:
- 페이지 접근 시 전체 캔버스 데이터 로드
- Server Component에서 초기 렌더링 데이터 제공
- React Flow로 변환 가능한 형식 반환

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Query 통합 테스트 케이스  
**Process Model 매핑**: Scenario 0 - Sequence 1

---

### 2. Repository 수도코드

#### BlockMountRepository

- **파일 위치**: `src/domains/canvas-management/infrastructure/repositories/block-mount.repository.ts`
- **역할**: BlockMount Aggregate의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): BlockMount Aggregate를 데이터베이스에 저장 (생성/수정)
  - findById(): BlockMountId로 BlockMount Aggregate 조회
  - findByPageId(): PageId로 여러 BlockMount Aggregate 조회 (z-order 정렬)
  - findByBlockId(): BlockId로 여러 BlockMount Aggregate 조회
  - delete(): BlockMount Aggregate 삭제 (soft delete)
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **성능 최적화**: z-order 정렬을 위한 인덱스 활용, 페이지별 블럭 목록 조회 최적화

```typescript
interface BlockMountRepository {
  save(blockMount: BlockMountAggregate): Promise<void>;
  findById(blockMountId: BlockMountId): Promise<BlockMountAggregate | null>;
  findByPageId(pageId: PageId): Promise<BlockMountAggregate[]>;
  findByBlockId(blockId: BlockId): Promise<BlockMountAggregate[]>;
  delete(blockMountId: BlockMountId): Promise<void>;
  saveAll(blockMounts: BlockMountAggregate[]): Promise<void>; // 다중 저장
}

class DrizzleBlockMountRepository implements BlockMountRepository {
  async findByPageId(pageId: PageId): Promise<BlockMountAggregate[]> {
    // 1. PageId로 DB 조회
    // 2. z_order DESC 정렬 적용
    // 3. DB 모델들 → Aggregate 배열 변환
    // 4. BlockMountAggregate[] 반환
  }
  
  async saveAll(blockMounts: BlockMountAggregate[]): Promise<void> {
    // 1. 다중 BlockMount를 배치로 저장
    // 2. 트랜잭션으로 일괄 처리
    // 3. 성능 최적화 (정렬 도구 사용 시)
  }
}
```

**사용 시나리오**:
- Service Layer에서 BlockMount Aggregate 저장/조회
- 페이지별 블럭 목록 조회 (z-order 정렬)
- 다중 블럭 변형 시 배치 처리

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

#### EdgeRepository

- **파일 위치**: `src/domains/canvas-management/infrastructure/repositories/edge.repository.ts`
- **역할**: Edge Aggregate의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): Edge Aggregate를 데이터베이스에 저장 (생성/수정)
  - findById(): EdgeId로 Edge Aggregate 조회
  - findByPageId(): PageId로 여러 Edge Aggregate 조회
  - findByBlockId(): BlockId로 연결된 Edge Aggregate들 조회
  - deleteAll(): 여러 Edge Aggregate 삭제 (블럭 삭제 시)
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **특징**: 블럭 삭제 시 연결된 엣지 일괄 삭제를 위한 배치 처리 지원

```typescript
interface EdgeRepository {
  save(edge: EdgeAggregate): Promise<void>;
  findById(edgeId: EdgeId): Promise<EdgeAggregate | null>;
  findByPageId(pageId: PageId): Promise<EdgeAggregate[]>;
  findByConnectedBlockId(blockId: BlockId): Promise<EdgeAggregate[]>;
  deleteAll(edgeIds: EdgeId[]): Promise<void>;
}

class DrizzleEdgeRepository implements EdgeRepository {
  async findByConnectedBlockId(blockId: BlockId): Promise<EdgeAggregate[]> {
    // 1. sourceBlockId 또는 targetBlockId로 조회
    // 2. 연결된 모든 엣지 반환
    // 3. EdgeAggregate[] 반환
  }
  
  async deleteAll(edgeIds: EdgeId[]): Promise<void> {
    // 1. 다중 EdgeId로 일괄 삭제
    // 2. 트랜잭션으로 원자성 보장
    // 3. 블럭 삭제 시 연결된 엣지 정리
  }
}
```

**사용 시나리오**:
- Service Layer에서 Edge Aggregate 저장/조회
- 페이지별 엣지 목록 조회
- 블럭 삭제 시 연결된 엣지 일괄 정리

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

#### ViewportRepository

- **파일 위치**: `src/domains/canvas-management/infrastructure/repositories/viewport.repository.ts`
- **역할**: Viewport Aggregate의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): Viewport Aggregate를 데이터베이스에 저장 (생성/수정)
  - findById(): ViewportId로 Viewport Aggregate 조회
  - findByPageId(): PageId로 Viewport Aggregate 조회 (1:1 관계)
  - delete(): Viewport Aggregate 삭제
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **특징**: 페이지별 뷰포트 상태 자동 저장/복원을 위한 최적화

```typescript
interface ViewportRepository {
  save(viewport: ViewportAggregate): Promise<void>;
  findById(viewportId: ViewportId): Promise<ViewportAggregate | null>;
  findByPageId(pageId: PageId): Promise<ViewportAggregate | null>;
  delete(viewportId: ViewportId): Promise<void>;
}

class DrizzleViewportRepository implements ViewportRepository {
  async findByPageId(pageId: PageId): Promise<ViewportAggregate | null> {
    // 1. PageId로 Viewport 조회 (1:1 관계)
    // 2. DB 모델 → Aggregate 변환
    // 3. ViewportAggregate 반환 또는 null
  }
}
```

**사용 시나리오**:
- Service Layer에서 Viewport Aggregate 저장/조회
- 페이지별 뷰포트 상태 관리
- 뷰포트 상태 자동 저장/복원

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

### 2. ACL (Anti-Corruption Layer) 수도코드

#### ReactFlowACL

- **파일 위치**: `src/domains/canvas-management/backend/acl/react-flow.acl.ts`
- **역할**: React Flow 라이브러리와 Canvas Management 도메인 간 데이터 변환 레이어
- **주요 메서드**:
  - toDomainBlockMount(): React Flow Node → BlockMount 도메인 모델로 변환
  - toDomainEdge(): React Flow Edge → Edge 도메인 모델로 변환
  - toReactFlowNode(): BlockMount 도메인 모델 → React Flow Node로 변환
  - toReactFlowEdge(): Edge 도메인 모델 → React Flow Edge로 변환
  - validateReactFlowData(): React Flow 데이터 유효성 검증
- **특징**:
  - 외부 라이브러리의 변화가 도메인에 영향을 주지 않도록 격리
  - 타입 안전성 보장
  - 매핑 로직 캡슐화
- **의존성**: React Flow 타입 정의, Canvas Management 도메인 모델

```typescript
import { Node, Edge as ReactFlowEdge } from '@xyflow/react';

class ReactFlowACL {
  toDomainBlockMount(node: Node): BlockMount {
    // 1. React Flow Node → BlockMount Entity 변환
    // 2. position, size, zOrder 매핑
    // 3. BlockMount 생성자 호출
    // 4. BlockMount 반환
  }
  
  toReactFlowNode(blockMount: BlockMount): Node {
    // 1. BlockMount Entity → React Flow Node 변환
    // 2. id, position, data 매핑
    // 3. React Flow Node 객체 생성
    // 4. Node 반환
  }
  
  toDomainEdge(edge: ReactFlowEdge): Edge {
    // 1. React Flow Edge → Edge Entity 변환
    // 2. source, target, type, label, style 매핑
    // 3. Edge 생성자 호출
    // 4. Edge 반환
  }
  
  toReactFlowEdge(edge: Edge): ReactFlowEdge {
    // 1. Edge Entity → React Flow Edge 변환
    // 2. id, source, target, type, label, style 매핑
    // 3. React Flow Edge 객체 생성
    // 4. ReactFlowEdge 반환
  }
  
  validateReactFlowData(nodes: Node[], edges: ReactFlowEdge[]): boolean {
    // 1. React Flow 데이터 유효성 검증
    // 2. 필수 필드 확인
    // 3. boolean 반환
  }
}
```

**사용 시나리오**:
- React Flow Node/Edge를 도메인 모델로 변환
- 도메인 모델을 React Flow 형식으로 변환
- React Flow 초기화 실패 시 에러 처리

**우선순위**: ⭐️⭐️⭐️⭐️  
**Software Design 참조**: React Flow ACL 섹션

---

### 3. Read Models 수도코드

#### CanvasView

- **파일 위치**: `src/domains/canvas-management/infrastructure/queries/canvas.query.ts`
- **역할**: 캔버스 조회에 최적화된 Read Model
- **주요 속성**:
  - canvasId: CanvasId - 캔버스 ID
  - pageId: PageId - 페이지 ID
  - blocks: BlockMountView[] - 페이지에 마운트된 블럭 목록
  - edges: EdgeView[] - 페이지 내 엣지 목록
  - viewport: ViewportView - 뷰포트 상태
  - totalBlockCount: number - 전체 블럭 개수
  - totalEdgeCount: number - 전체 엣지 개수
- **주요 메서드**:
  - getCanvasView(): 단일 Canvas View 조회
  - getCanvasViewWithBlocks(): 블럭 정보 포함 Canvas View 조회
- **DB 최적화**:
  - 인덱스 활용: page_id, z_order에 복합 인덱스
  - JOIN 최소화: 필요한 필드만 조회
  - 페이징: 블럭이 많은 경우 (100개 이상) 청크 로딩
- **캐싱 전략**:
  - Redis 캐싱 (TTL: 5분)
  - 키 형식: `canvas:${pageId}`
  - 캐시 무효화: 관련 Aggregate 업데이트 시

```typescript
interface CanvasView {
  canvasId: CanvasId;
  pageId: PageId;
  blocks: BlockMountView[];
  edges: EdgeView[];
  viewport: ViewportView;
  totalBlockCount: number;
  totalEdgeCount: number;
}

interface BlockMountView {
  blockMountId: BlockMountId;
  blockId: BlockId;
  position: Position;
  size: Size;
  zOrder: ZOrder;
  blockType: string;
  blockData: any;
  createdAt: Date;
  updatedAt: Date;
}

interface EdgeView {
  edgeId: EdgeId;
  sourceBlockId: BlockId;
  targetBlockId: BlockId;
  edgeType: EdgeType;
  edgeLabel?: string;
  edgeStyle: EdgeStyle;
  createdAt: Date;
  updatedAt: Date;
}

interface ViewportView {
  viewportId: ViewportId;
  zoomLevel: ZoomLevel;
  center: ViewportCenter;
  lastSaved: Date;
  isRestored: boolean;
}

async function getCanvasView(pageId: PageId, userId: UserId): Promise<CanvasView> {
  // 1. Workspace Management Repository: 페이지 접근 권한 확인
  // 2. CanvasRepository.findById()
  // 3. BlockMountRepository.findByPageId() (z-order 정렬)
  // 4. EdgeRepository.findByPageId()
  // 5. ViewportRepository.findByPageId()
  // 6. Block Domain Service: 블럭 타입 및 속성 정보 배치 조회
  // 7. 데이터 조합하여 CanvasView 생성
  // 8. CanvasView 반환
}
```

**사용 시나리오**:
- 페이지 접근 시 캔버스 전체 상태 조회
- 블럭/엣지 변경 시 캐시 무효화
- 대시보드에서 캔버스 요약 정보 표시

**최적화 전략**:
- 캐싱: Redis (TTL: 5분)
- 인덱스: page_id, z_order, block_id
- 페이징: 100개 이상 블럭 시 청크 로딩

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Read Models 테스트 케이스

---

## 🚀 Application Layer

> **가이드 참조**: Phase 2.3, 2.4 - Service 및 Server Actions 수도코드

### 1. Service 수도코드

#### CanvasManagementService

- **파일 위치**: `src/domains/canvas-management/application/services/canvas-management.service.ts`
- **역할**: Canvas Management의 비즈니스 유스케이스를 조율하고 실행하는 Application Service
- **주요 의존성**:
  - GetCanvasViewQuery: 페이지별 캔버스 데이터 조회 (Read Model)
  - BlockMountRepository: BlockMount Aggregate 영속성 관리
  - EdgeRepository: Edge Aggregate 영속성 관리
  - ViewportRepository: Viewport Aggregate 영속성 관리
  - BlockManagementService: Block Management Domain 서비스 통신
  - WorkspaceManagementService: Workspace Management 도메인 통신
  - ReactFlowACL: React Flow 라이브러리 연동
- **주요 메서드**:
  - getCanvasView(): 페이지 데이터 로드 (블럭/엣지/뷰포트 복원) - READ MODEL
  - mountBlock(): 블럭 마운트 및 BlockMounted 처리
  - updateBlockPosition(): 블럭 위치 업데이트 및 BlockPositionUpdated 처리
  - updateBlockSize(): 블럭 크기 업데이트 및 BlockSizeUpdated 처리
  - updateBlockZOrder(): 블럭 Z-Order 업데이트 및 BlockZOrderUpdated 처리
  - updateMultipleBlockPositions(): 다중 블럭 위치 일괄 업데이트 (정렬/분포 후)
  - duplicateBlock(): 블럭 복제 및 마운트 처리
  - deleteBlock(): 블럭 삭제 처리 (툴바 버튼 & 키보드 단축키 모두 처리)
  - createEdge(): 엣지 생성 및 EdgeCreated 처리
  - updateEdge(): 엣지 속성 업데이트 (타입, 레이블, 스타일)
  - deleteEdge(): 엣지 삭제 처리
  - updateViewport(): 뷰포트 업데이트 및 ViewportUpdated 처리
  - saveViewportState(): 뷰포트 상태 저장 (페이지 이탈 시)
  - restoreViewportState(): 뷰포트 상태 복원 (페이지 재진입 시)
- **트랜잭션**: 하나의 Service 메서드는 하나의 트랜잭션 단위
- **특징**:
  - 얇은 Application Layer: 도메인 로직은 Aggregate에 위임
  - Result 패턴 사용: 함수형 에러 처리
  - 의존성 주입: 테스트 용이성 확보

```typescript
class CanvasManagementService {
  constructor(
    private getCanvasViewQuery: GetCanvasViewQuery,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository,
    private blockManagementService: BlockManagementService,
    private workspaceManagementService: WorkspaceManagementService,
    private reactFlowACL: ReactFlowACL
  ) {}
  
  async getCanvasView(pageId: PageId, userId: UserId): Promise<Result<CanvasView>> {
    try {
      // 1. GetCanvasViewQuery.execute() 호출 (Read Model)
      // 2. Result.ok(canvasView) 반환
    } catch (error) {
      // 1. 에러 타입 분류
      // 2. Result.err(error) 반환
    }
  }
  
  async mountBlock(command: MountBlockCommand): Promise<Result<BlockMountAggregate>> {
    try {
      // 1. Block Management Domain으로 블럭 존재 확인 (DB JOIN으로 blocks 테이블 확인)
      // 2. BlockMountAggregate.mountBlock() 호출
      // 3. BlockMountRepository.save() 호출
      // 4. 이벤트 발행
      // 5. Result.ok(blockMountAggregate) 반환
    } catch (error) {
      // 1. 에러 타입 분류
      // 2. Result.err(error) 반환
    }
  }
  
  async updateBlockPosition(command: UpdateBlockPositionCommand): Promise<Result<BlockMountAggregate>> {
    try {
      // 1. BlockMountRepository.findById() 호출
      // 2. BlockMountAggregate.updatePosition() 호출
      // 3. BlockMountRepository.save() 호출
      // 4. Result.ok(blockMountAggregate) 반환
    } catch (error) {
      // 1. 에러 타입 분류
      // 2. Result.err(error) 반환
    }
  }
  
  async updateMultipleBlockPositions(command: UpdateMultipleBlockPositionsCommand): Promise<Result<void>> {
    try {
      // 1. 다중 BlockMount 조회
      // 2. 각 블럭 위치 업데이트
      // 3. 배치 저장 (트랜잭션)
      // 4. Result.ok() 반환
    } catch (error) {
      // 1. 에러 타입 분류
      // 2. Result.err(error) 반환
    }
  }
}
```

**처리 흐름**:
1. Command 유효성 검증
2. Repository에서 Aggregate 조회 (필요시)
3. Aggregate 메서드 호출 (도메인 로직 실행)
4. Repository에 Aggregate 저장
5. 도메인 이벤트 발행
6. Result.ok() 또는 Result.err() 반환

**사용 시나리오**:
- Server Actions에서 비즈니스 로직 실행
- 여러 Aggregate 간 조율이 필요한 경우
- 트랜잭션 경계 설정

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Service 통합 테스트 케이스

---

### 2. Server Actions 수도코드

#### getCanvasViewAction

- **파일 위치**: `src/domains/canvas-management/actions/canvas.actions.ts`
- **역할**: 캔버스 전체 데이터 조회 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - 의존성 주입 패턴으로 Service Layer 활용
  - Read Model Service 호출
  - 도메인 모델 → DTO 직렬화 (Value Object → string, Date → ISO string)
  - Next.js 캐시 무효화 (revalidatePath)
- **입력**: pageId (string), userId (string)
- **출력**: CanvasViewDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 권한 없음 → UnauthorizedError
  - 시스템 에러 → InternalServerError
- **특징**:
  - `'use server'` 지시어 사용
  - Plain Object만 반환 (직렬화 가능)
  - 의존성 주입으로 테스트 용이성 확보

```typescript
'use server'

async function getCanvasViewAction(pageId: string, userId: string): Promise<Result<CanvasViewDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입 (Repository, Service)
    const canvasManagementService = new CanvasManagementService(...);
    
    // 3. Read Model 조회
    const result = await canvasManagementService.getCanvasView(new PageId(pageId), new UserId(userId));
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 4. DTO 직렬화
    const dto: CanvasViewDTO = {
      pageId: result.value.pageId.value,
      blocks: result.value.blocks.map(b => ({
        blockMountId: b.blockMountId.value,
        blockId: b.blockId.value,
        position: b.position,
        size: b.size,
        zOrder: b.zOrder.value,
        blockType: b.blockType,
        blockData: b.blockData
      })),
      edges: result.value.edges,
      viewport: result.value.viewport,
      totalBlockCount: result.value.totalBlockCount,
      totalEdgeCount: result.value.totalEdgeCount
    };
    
    // 5. 결과 반환
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Canvas view load failed:', error);
    return Result.err(new InternalServerError('Canvas view load failed'));
  }
}
```

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 의존성 주입: Service 인스턴스 생성
3. Read Model 조회: getCanvasView() 호출
4. DTO 직렬화: 도메인 모델 → 직렬화 가능한 Plain Object
5. 결과 반환: Result<DTO> 형식

**사용 시나리오**:
- 페이지 접근 시 캔버스 전체 데이터 로드
- Server Components에서 캔버스 상태 조회
- React Flow 초기화 데이터 제공

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

#### mountBlockAction

- **파일 위치**: `src/domains/canvas-management/actions/block.actions.ts`
- **역할**: 블럭 마운트 기능을 제공하는 Next.js Server Action
- **입력**: pageId, blockId, position, size
- **출력**: BlockMountedDTO
- **인증**: Supabase Auth 기반 사용자 인증 필수

```typescript
'use server'

async function mountBlockAction(
  pageId: string, 
  blockId: string, 
  position: { x: number; y: number }, 
  size: { width: number; height: number }
): Promise<Result<BlockMountedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository(db);
    const canvasManagementService = new CanvasManagementService(blockMountRepository, ...);
    
    // 3. Command 생성
    const command: MountBlockCommand = {
      pageId: new PageId(pageId),
      blockId: new BlockId(blockId),
      position: new Position(position.x, position.y),
      size: new Size(size.width, size.height)
    };
    
    // 4. 도메인 로직 실행
    const result = await canvasManagementService.mountBlock(command);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 5. DTO 직렬화
    const dto: BlockMountedDTO = {
      blockMountId: result.value.id.value,
      blockId: result.value.blockId.value,
      position: result.value.position,
      size: result.value.size,
      zOrder: result.value.zOrder.value,
      mountedAt: result.value.createdAt.toISOString()
    };
    
    // 6. 캐시 무효화
    revalidatePath(`/pages/${pageId}`);
    
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Block mount failed:', error);
    return Result.err(new InternalServerError('Block mount failed'));
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

#### updateBlockPositionAction

- **파일 위치**: `src/domains/canvas-management/actions/block.actions.ts`
- **역할**: 블럭 위치 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: blockMountId, newPosition
- **출력**: BlockPositionUpdatedDTO

```typescript
'use server'

async function updateBlockPositionAction(
  blockMountId: string,
  newPosition: { x: number; y: number },
  userId: string
): Promise<Result<BlockPositionUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입
    const canvasManagementService = new CanvasManagementService(...);
    
    // 3. Command 생성
    const command: UpdateBlockPositionCommand = {
      blockMountId: new BlockMountId(/* blockMountId 파싱 */),
      newPosition: new Position(newPosition.x, newPosition.y),
      userId: new UserId(userId)
    };
    
    // 4. 도메인 로직 실행
    const result = await canvasManagementService.updateBlockPosition(command);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 5. DTO 직렬화 및 반환
    const dto: BlockPositionUpdatedDTO = {
      blockMountId: result.value.id.value,
      newPosition: result.value.position,
      updatedAt: result.value.updatedAt.toISOString()
    };
    
    revalidatePath(`/pages/${command.blockMountId.getPageId()}`);
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Block position update failed:', error);
    return Result.err(new InternalServerError('Block position update failed'));
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

#### updateMultipleBlockPositionsAction

- **파일 위치**: `src/domains/canvas-management/actions/block.actions.ts`
- **역할**: 다중 블럭 위치 일괄 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: blockPositions[]
- **출력**: MultipleBlockPositionsUpdatedDTO

```typescript
'use server'

async function updateMultipleBlockPositionsAction(
  blockPositions: Array<{blockMountId: string, position: {x: number, y: number}}>,
  userId: string
): Promise<Result<MultipleBlockPositionsUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입
    const canvasManagementService = new CanvasManagementService(...);
    
    // 3. Command 생성
    const command: UpdateMultipleBlockPositionsCommand = {
      blockPositions: blockPositions.map(bp => ({
        blockMountId: new BlockMountId(/* bp.blockMountId 파싱 */),
        position: new Position(bp.position.x, bp.position.y)
      })),
      userId: new UserId(userId)
    };
    
    // 4. 도메인 로직 실행 (일괄 처리)
    const result = await canvasManagementService.updateMultipleBlockPositions(command);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 5. DTO 직렬화 및 반환
    const dto: MultipleBlockPositionsUpdatedDTO = {
      updatedCount: result.value.length,
      updatedAt: new Date().toISOString()
    };
    
    revalidatePath(`/pages/${/* pageId */}`);
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Multiple block positions update failed:', error);
    return Result.err(new InternalServerError('Multiple block positions update failed'));
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

#### createEdgeAction

- **파일 위치**: `src/domains/canvas-management/actions/edge.actions.ts`
- **역할**: 엣지 생성 기능을 제공하는 Next.js Server Action
- **입력**: pageId, sourceBlockId, targetBlockId, edgeType
- **출력**: EdgeCreatedDTO

```typescript
'use server'

async function createEdgeAction(
  pageId: string,
  sourceBlockId: string,
  targetBlockId: string,
  edgeType?: string
): Promise<Result<EdgeCreatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입
    const edgeRepository = new DrizzleEdgeRepository(db);
    const canvasManagementService = new CanvasManagementService(edgeRepository, ...);
    
    // 3. Command 생성
    const command: CreateEdgeCommand = {
      pageId: new PageId(pageId),
      sourceBlockId: new BlockId(sourceBlockId),
      targetBlockId: new BlockId(targetBlockId),
      edgeType: edgeType ? new EdgeType(edgeType) : undefined
    };
    
    // 4. 도메인 로직 실행
    const result = await canvasManagementService.createEdge(command);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 5. DTO 직렬화 및 반환
    const dto: EdgeCreatedDTO = {
      edgeId: result.value.id.value,
      sourceBlockId: result.value.sourceBlockId.value,
      targetBlockId: result.value.targetBlockId.value,
      edgeType: result.value.edgeType.value,
      createdAt: result.value.createdAt.toISOString()
    };
    
    revalidatePath(`/pages/${pageId}`);
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Edge creation failed:', error);
    return Result.err(new InternalServerError('Edge creation failed'));
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

#### updateViewportAction

- **파일 위치**: `src/domains/canvas-management/actions/viewport.actions.ts`
- **역할**: 뷰포트 업데이트 기능을 제공하는 Next.js Server Action
- **입력**: pageId, zoomLevel, center
- **출력**: ViewportUpdatedDTO

```typescript
'use server'

async function updateViewportAction(
  pageId: string,
  viewportData: {
    zoomLevel: number;
    center: { x: number; y: number };
  }
): Promise<Result<ViewportUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return Result.err(new UnauthorizedError('User not authenticated'));
    }
    
    // 2. 의존성 주입
    const viewportRepository = new DrizzleViewportRepository(db);
    const canvasManagementService = new CanvasManagementService(viewportRepository, ...);
    
    // 3. Command 생성
    const command: UpdateViewportCommand = {
      pageId: new PageId(pageId),
      zoomLevel: new ZoomLevel(viewportData.zoomLevel),
      center: new ViewportCenter(viewportData.center.x, viewportData.center.y)
    };
    
    // 4. 도메인 로직 실행
    const result = await canvasManagementService.updateViewport(command);
    if (result.isErr()) {
      return Result.err(result.error);
    }
    
    // 5. DTO 직렬화 및 반환
    const dto: ViewportUpdatedDTO = {
      viewportId: result.value.id.value,
      zoomLevel: result.value.zoomLevel.value,
      center: result.value.center,
      updatedAt: result.value.updatedAt.toISOString()
    };
    
    revalidatePath(`/pages/${pageId}`);
    return Result.ok(dto);
    
  } catch (error) {
    console.error('Viewport update failed:', error);
    return Result.err(new InternalServerError('Viewport update failed'));
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

### 3. Cross-Domain 서비스 연동

#### 동기적 서비스 주입 패턴

- **파일 위치**: `src/domains/canvas-management/application/services/canvas-management.service.ts`
- **역할**: 다른 도메인의 서비스를 직접 주입받아 동기적으로 연동
- **주요 연동 서비스**:
  - WorkspaceManagementService: 페이지 생명주기 연동
  - BlockDomainService: 블럭 생성/복제 연동
- **연동 패턴**:
  - 동기적 호출: Service Layer에서 직접 메서드 호출
  - 트랜잭션 일관성: 같은 요청 내에서 데이터 일관성 보장
  - 에러 전파: 하위 도메인 에러를 상위로 즉시 전파
- **의존성**: WorkspaceManagementService, BlockDomainService
- **특징**:
  - 도메인 간 동기적 통신 (Next.js 풀스택 환경)
  - 강한 일관성 (Strong Consistency) 보장
  - 단일 트랜잭션 내 처리

```typescript
import { WorkspaceManagementService } from '@workspace-management/services';
import { BlockDomainService } from '@block-domain/services';

class CanvasManagementService {
  constructor(
    private canvasRepository: CanvasRepository,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository,
    private workspaceManagementService: WorkspaceManagementService, // 동기 주입
    private blockDomainService: BlockDomainService, // 동기 주입
    private reactFlowACL: ReactFlowACL
  ) {}
  
  async initializeCanvas(command: InitializeCanvasCommand): Promise<Result<CanvasAggregate>> {
    try {
      // 1. Workspace Management Service로 페이지 접근 권한 확인 (동기 호출)
      const hasAccess = await this.workspaceManagementService.checkPageAccess(
        command.pageId, 
        command.userId
      );
      
      if (!hasAccess) {
        return Result.err(new UnauthorizedError('No access to page'));
      }
      
      // 2. CanvasAggregate.create() 호출
      const canvasAggregate = CanvasAggregate.create(command.pageId);
      
      // 3. CanvasRepository.save() 호출
      await this.canvasRepository.save(canvasAggregate);
      
      // 4. Result.ok(canvasAggregate) 반환
      return Result.ok(canvasAggregate);
      
    } catch (error) {
      return Result.err(error);
    }
  }
  
  async mountBlock(command: MountBlockCommand): Promise<Result<BlockMountAggregate>> {
    try {
      // 1. Block Domain Service로 블럭 존재 확인 (동기 호출)
      const blockExists = await this.blockDomainService.checkBlockExists(command.blockId);
      
      if (!blockExists) {
        return Result.err(new CanvasManagementError('BLOCK_NOT_FOUND', 'Block not found'));
      }
      
      // 2. Block Domain Service로 블럭 타입 조회 (동기 호출)
      const blockType = await this.blockDomainService.getBlockType(command.blockId);
      
      // 3. 블럭 타입별 기본 크기 적용 (필요시)
      const size = command.size || this.getDefaultSize(blockType);
      
      // 4. BlockMountAggregate.mountBlock() 호출
      const blockMountAggregate = BlockMountAggregate.mountBlock(
        command.pageId,
        command.blockId,
        command.position,
        size
      );
      
      // 5. BlockMountRepository.save() 호출
      await this.blockMountRepository.save(blockMountAggregate);
      
      // 6. Result.ok(blockMountAggregate) 반환
      return Result.ok(blockMountAggregate);
      
    } catch (error) {
      return Result.err(error);
    }
  }
  
  async duplicateBlock(originalBlockId: BlockId, pageId: PageId): Promise<Result<BlockMountAggregate>> {
    try {
      // 1. Block Management Domain으로 블럭 복제 (완전히 새로운 블럭 생성)
      const newBlockId = await this.blockManagementService.duplicateBlockAction(originalBlockId);
      
      // 2. 원본 블럭 마운트 정보 조회
      const originalBlockMount = await this.blockMountRepository.findByBlockId(originalBlockId);
      if (!originalBlockMount) {
        return Result.err(new CanvasManagementError('BLOCK_NOT_FOUND', 'Original block not found'));
      }
      
      // 3. 복제된 블럭을 새 위치에 마운트
      const newPosition = this.calculateDuplicatePosition(originalBlockMount.position);
      const blockMountAggregate = BlockMountAggregate.mountBlock(
        pageId,
        newBlockId,
        newPosition,
        originalBlockMount.size
      );
      
      // 4. BlockMountRepository.save() 호출
      await this.blockMountRepository.save(blockMountAggregate);
      
      return Result.ok(blockMountAggregate);
      
    } catch (error) {
      return Result.err(error);
    }
  }
}
```

**처리 흐름**:
1. 외부 도메인 서비스 주입: 생성자에서 의존성 주입
2. 동기적 서비스 호출: await로 다른 도메인 메서드 직접 호출
3. 에러 처리: 외부 도메인 에러를 캐치하여 Result 패턴으로 반환
4. 트랜잭션 일관성: 단일 요청 내에서 모든 작업 완료
5. ACL 활용: 외부 도메인 데이터를 도메인 모델로 변환

**사용 시나리오**:
- Workspace Management Service: 페이지 접근 권한 확인
- Block Management Service: 블럭 생성/복제/삭제, 블럭 정보 조회 (DB JOIN)
- 동기적 호출로 즉시 결과 반환 및 에러 처리

**장점**:
- **강한 일관성**: 동일 트랜잭션 내에서 데이터 일관성 보장
- **즉시 피드백**: 외부 도메인 에러를 즉시 사용자에게 전달
- **단순한 플로우**: 비동기 이벤트 처리 없이 직관적인 호출 구조
- **Next.js 최적화**: 서버 컴포넌트 환경에 최적화된 동기 실행

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Service 통합 테스트 케이스 (외부 도메인 Mock 포함)

---

## 🎨 UI & Hook 전략

> **가이드 참조**: Phase 3.1 - 문서 구조 (섹션 5)

### React Hooks 사용

**사용할 Hook**:
- `useOptimistic`: 낙관적 업데이트 (블럭 생성/변형/삭제 시 즉시 UI 반영)
- `useTransition`: 비동기 상태 관리 (Server Action 실행 중 로딩 상태)
- `useFormStatus`: 폼 제출 상태 (엣지 생성/편집 폼 처리)
- `useState`: Frontend State 관리 (블럭 선택, 스냅 가이드라인 표시 등)

**낙관적 업데이트 로직**:
```typescript
function useCanvasManagement(pageId: string) {
  const [optimisticBlocks, addOptimisticBlock] = useOptimistic(
    blocks,
    (state, newBlock: BlockMountView) => [...state, newBlock]
  );
  
  const [isPending, startTransition] = useTransition();
  
  const mountBlock = useCallback(async (blockData: MountBlockData) => {
    // 1. 낙관적 업데이트
    const optimisticBlock = createOptimisticBlock(blockData);
    addOptimisticBlock(optimisticBlock);
    
    // 2. Server Action 실행
    startTransition(async () => {
      const result = await mountBlockAction(pageId, blockData);
      if (result.isErr()) {
        // 3. 실패 시 롤백 (optimisticBlock 제거)
        removeOptimisticBlock(optimisticBlock.id);
        // 에러 처리
      }
    });
  }, [pageId]);
  
  // 롤백 로직: 실패 시 optimistic 항목 제거
  return {
    blocks: optimisticBlocks,
    mountBlock,
    isPending
  };
}
```

**블럭 삭제 Hook** (Optimistic UI + React Flow 콜백):
```typescript
function useCanvasBlockLifecycle(pageId: string) {
  const [optimisticBlocks, updateOptimisticBlocks] = useOptimistic(
    blocks,
    (state, action: { type: 'add' | 'remove', blockId: string }) => {
      if (action.type === 'add') return [...state, action.blockId];
      return state.filter(id => id !== action.blockId);
    }
  );
  
  // 툴바 버튼 삭제 (Optimistic UI 패턴)
  const deleteBlock = useCallback(async (blockId: string) => {
    // 1. 즉시 React Flow에서 제거
    updateOptimisticBlocks({ type: 'remove', blockId });
    
    // 2. Server Action 호출
    const result = await deleteBlockAction(blockId, userId);
    
    if (result.isErr()) {
      // 3. 실패 시 복원
      updateOptimisticBlocks({ type: 'add', blockId });
      console.error('Block deletion failed:', result.error);
    }
  }, [pageId, userId]);
  
  // React Flow 콜백 삭제 (onNodesDelete)
  const handleBlockDeletion = useCallback(async (blockIds: string[]) => {
    // React Flow에서 이미 제거된 상태이므로, 서버 액션만 호출
    for (const blockId of blockIds) {
      const result = await deleteBlockAction(blockId, userId);
      
      if (result.isErr()) {
        // 실패 시 React Flow에 블럭 복원
        // (React Flow Store 직접 조작 또는 상태 복원 로직)
        console.error('Block deletion failed:', result.error);
      }
    }
  }, [userId]);
  
  return {
    deleteBlock,        // 툴바 버튼용
    handleBlockDeletion // React Flow 콜백용
  };
}
```

**React Flow 콜백 연동**:
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  deleteKeyCode={['Delete', 'Backspace']}
  onNodesDelete={(nodes) => {
    // React Flow가 자동으로 노드 제거 후 콜백 호출
    const blockIds = nodes.map(node => node.id);
    handleBlockDeletion(blockIds);
  }}
>
```

**뷰포트 관리 Hook**:
```typescript
function useViewport(pageId: string) {
  const [viewport, setViewport] = useState<ViewportView | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const updateViewport = useCallback((zoomLevel: number, center: ViewportCenter) => {
    // 1. 즉시 UI 업데이트
    setViewport(prev => ({ ...prev, zoomLevel, center }));
    
    // 2. Server Action으로 상태 저장
    startTransition(async () => {
      await updateViewportAction(pageId, { zoomLevel, center });
    });
  }, [pageId]);
  
  return { viewport, updateViewport, isPending };
}
```

**블럭 선택 관리 Hook** (Frontend State Only):
```typescript
function useBlockSelection() {
  const [selectedBlocks, setSelectedBlocks] = useState<Set<BlockMountId>>(new Set());
  
  const selectBlock = useCallback((blockId: BlockMountId, multiSelect: boolean) => {
    setSelectedBlocks(prev => {
      const newSelection = new Set(multiSelect ? prev : []);
      if (prev.has(blockId) && multiSelect) {
        // Ctrl + 클릭: 토글
        newSelection.delete(blockId);
      } else {
        // 단일 선택 또는 추가 선택
        newSelection.add(blockId);
      }
      return newSelection;
    });
  }, []);
  
  const selectAll = useCallback((allBlockIds: BlockMountId[]) => {
    setSelectedBlocks(new Set(allBlockIds));
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedBlocks(new Set());
  }, []);
  
  return { 
    selectedBlocks, 
    selectBlock, 
    selectAll, 
    clearSelection,
    hasSelection: selectedBlocks.size > 0,
    isMultiSelect: selectedBlocks.size > 1
  };
}
```

**스냅 가이드라인 Hook** (Frontend State Only):
```typescript
function useSnapGuidelines(blocks: BlockMountView[]) {
  const [guidelines, setGuidelines] = useState<SnapGuideline[]>([]);
  
  const calculateGuidelines = useCallback((draggingBlock: BlockMountView, currentPosition: Position) => {
    const newGuidelines: SnapGuideline[] = [];
    
    blocks.forEach(block => {
      if (block.blockMountId === draggingBlock.blockMountId) return;
      
      // 중심선 스냅 (우선순위 높음)
      const centerDist = Math.abs(currentPosition.x - block.position.x);
      if (centerDist <= 5) {
        newGuidelines.push({ type: 'center', position: block.position, priority: 'high' });
      }
      
      // 가장자리 스냅 (우선순위 낮음)
      const edgeDist = Math.abs(currentPosition.x - (block.position.x + block.size.width));
      if (edgeDist <= 5) {
        newGuidelines.push({ type: 'edge', position: block.position, priority: 'low' });
      }
    });
    
    setGuidelines(newGuidelines);
  }, [blocks]);
  
  return { guidelines, calculateGuidelines };
}
```

### UI Component 연동

**Server Action 연결**:
- Form → Server Action → Result 처리
- 로딩/에러 상태 표시
- 접근성 고려 (aria-label, role 등)

**React Flow 연동 패턴**:
```typescript
function CanvasComponent({ pageId }: { pageId: string }) {
  const { blocks, mountBlock, isPending } = useCanvasManagement(pageId);
  const { viewport, updateViewport } = useViewport(pageId);
  const { deleteBlock, handleBlockDeletion } = useCanvasBlockLifecycle(pageId);
  
  const onNodesChange = useCallback((changes) => {
    // React Flow 이벤트 → 도메인 이벤트 변환
    changes.forEach(change => {
      if (change.type === 'position') {
        transformBlockAction(change.id, {
          newPosition: { x: change.position.x, y: change.position.y }
        });
      }
    });
  }, []);
  
  // React Flow 삭제 키 콜백 (Delete/Backspace 키)
  const onNodesDelete = useCallback((nodes) => {
    const blockIds = nodes.map(node => node.id);
    handleBlockDeletion(blockIds);
  }, [handleBlockDeletion]);
  
  return (
    <ReactFlow
      nodes={blocks.map(block => reactFlowACL.toReactFlowNode(block))}
      onNodesChange={onNodesChange}
      onNodesDelete={onNodesDelete}
      deleteKeyCode={['Delete', 'Backspace']}
      onMove={(event, viewport) => updateViewport(viewport.zoom, viewport.center)}
    >
      {/* 캔버스 컨텐츠 */}
    </ReactFlow>
  );
}
```

---

## 📋 TDD 구현 순서

> **가이드 참조**: Phase 3.2 - TDD 구현 순서 정의

### Phase별 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. Position VO
   - 테스트 작성 (RED)
   - 최소 구현 (GREEN)
   - 리팩토링 (REFACTOR)

2. Size VO
   - 동일한 TDD 사이클 적용

3. ZOrder VO
   - 동일한 TDD 사이클 적용

4. CanvasId, BlockMountId, EdgeId VO
   - 동일한 TDD 사이클 적용

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Canvas Entity
   - 비즈니스 규칙 테스트 포함

2. BlockMount Entity
   - 변형 로직 테스트 포함

3. Edge Entity
   - self-loop 허용 테스트 포함

4. Viewport Entity
   - 상태 저장/복원 테스트 포함

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. CanvasAggregate
   - 초기화 및 데이터 로드 테스트

2. BlockMountAggregate
   - 마운트, 변형, 정렬 테스트

3. EdgeAggregate
   - 생성, 수정, 삭제 테스트

4. ViewportAggregate
   - 뷰포트 관리 테스트

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. CanvasRepository (통합 테스트)
   - DB 연동, RLS 정책 테스트

2. BlockMountRepository (통합 테스트)
   - z-order 정렬, 배치 처리 테스트

3. EdgeRepository (통합 테스트)
   - 연결된 엣지 조회 테스트

4. ViewportRepository (통합 테스트)
   - 상태 저장/복원 테스트

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. CanvasManagementService (통합 테스트)
   - 전체 시나리오 플로우 테스트

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. initializeCanvasAction (통합 테스트)
   - 인증, 권한, 에러 처리 테스트

2. mountBlockAction (통합 테스트)
   - 블럭 마운트 플로우 테스트

3. transformBlockAction (통합 테스트)
   - 블럭 변형 플로우 테스트

4. createEdgeAction (통합 테스트)
   - 엣지 생성 플로우 테스트

5. updateViewportAction (통합 테스트)
   - 뷰포트 업데이트 플로우 테스트

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 캔버스 초기화 플로우
2. 블럭 생성 및 변형 플로우
3. 엣지 생성 및 관리 플로우
4. 뷰포트 상태 관리 플로우
```

### TDD 사이클 적용 방법

```bash
# 1. RED: 테스트 먼저 작성
$ touch src/domains/canvas-management/shared/value-objects/__tests__/position.test.ts
# 테스트 코드 작성
$ pnpm test position.test.ts
# 결과: FAIL

# 2. GREEN: 최소 구현
$ touch src/domains/canvas-management/shared/value-objects/position.vo.ts
# 최소 구현 코드 작성
$ pnpm test position.test.ts
# 결과: PASS

# 3. REFACTOR: 코드 개선
# 검증 로직 추가, 코드 정리
$ pnpm test position.test.ts
# 결과: PASS (리팩토링 후에도 통과)
```

### 커버리지 목표 달성 전략

```markdown
Testing Strategy 목표 참조:
- Value Objects: 95% 이상 → RED-GREEN-REFACTOR 철저히 적용
- Entities: 95% 이상 → 모든 public 메서드 테스트
- Aggregates: 90% 이상 → 비즈니스 로직 중심 테스트
- Services: 85% 이상 → 통합 테스트로 플로우 검증
- Repositories: 80% 이상 → DB 연동 테스트
- Server Actions: 85% 이상 → 인증, 에러 처리 포함

### 레이어별 상세 목표:
1. Value Objects: 모든 생성자 검증, equals, 비즈니스 메서드 테스트
2. Entities: 속성 변경, 비즈니스 규칙, 상태 전환 테스트
3. Aggregates: Command 처리, Event 발행, Invariant 검증 테스트
4. Services: 전체 플로우, 에러 처리, 트랜잭션 테스트
5. Repositories: CRUD, 쿼리 최적화, RLS 정책 테스트
6. Server Actions: 인증, 권한, 직렬화, 캐시 무효화 테스트
```

### Testing Strategy 참조

**중요**: 이미 작성된 `03-software-design.md` 문서를 참조하세요:
- 각 컴포넌트별 테스트 케이스 목록
- Process Model → Test 매핑
- 우선순위 및 커버리지 목표
- 테스트 도구 설정

```bash
# Testing Strategy 확인
$ cat docs/event-domain-design/domains/canvas-management-domain/03-software-design.md
```

---

## ✅ 검증 체크리스트

### 구현 수도코드 검증
- [ ] Software Design의 모든 Aggregate가 수도코드로 작성되었는가? ✅
- [ ] Testing Strategy의 테스트 케이스가 반영되었는가? ✅
- [ ] 모든 컴포넌트에 구현 수도코드가 있는가? ✅
- [ ] 모든 컴포넌트에 테스트 수도코드가 있는가? ✅

### 테스트 수도코드 검증
- [ ] Given-When-Then 패턴이 일관되게 적용되었는가? ✅
- [ ] Happy Path와 Edge Case가 모두 포함되었는가? ✅
- [ ] 불변식 검증이 테스트에 포함되었는가? ✅

### TDD 준비 검증
- [ ] TDD 구현 순서가 명확한가? ✅
- [ ] 커버리지 목표가 명시되었는가? ✅
- [ ] 각 Phase별 우선순위가 표시되었는가? ✅

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - 코드 리뷰 및 PR

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] Testing Strategy와 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Technical Specification을 따라 **TDD 친화적인 Canvas Management Domain**을 구현할 수 있습니다! 🚀
