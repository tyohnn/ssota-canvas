# Sprint 4: Property Override System Stories

**Sprint Goal**: 인스턴스별 커스터마이징 시스템 완성  
**Duration**: Week 7-8  
**Story Points**: 15

---

## 📋 Story CS-2.1: Property Override Management
**Story Points**: 8 | **Priority**: Critical

### User Story
**As a** 사용자  
**I want to** 컴포넌트 인스턴스의 개별 속성을 커스터마이징  
**So that** 기본 템플릿을 유지하면서도 특별한 요구사항을 충족할 수 있다

### Detailed Acceptance Criteria

#### AC1: 속성 오버라이드 생성
```gherkin
Given 컴포넌트 인스턴스가 선택되어 있고
When 사용자가 속성 패널에서 값을 변경하면
Then 해당 속성이 오버라이드 상태로 마킹되고
And 원본 컴포넌트 값은 변경되지 않고
And 오버라이드 값이 인스턴스에만 적용된다
```

#### AC2: 오버라이드 상태 추적
```gherkin
Given 인스턴스에 오버라이드된 속성이 있을 때
When 사용자가 속성 패널을 열면
Then 오버라이드된 속성이 시각적으로 구분되고
And 원본 값과 오버라이드 값을 모두 확인할 수 있고
And 오버라이드 히스토리를 조회할 수 있다
```

#### AC3: 선택적 동기화
```gherkin
Given 컴포넌트 속성이 업데이트되었을 때
When 인스턴스들에 동기화가 발생하면
Then 오버라이드되지 않은 속성만 업데이트되고
And 오버라이드된 속성은 기존 값을 유지하고
And 사용자에게 동기화 결과가 알려진다
```

#### AC4: 부분 오버라이드 지원
```gherkin
Given 복합 속성(예: 스타일 객체)이 있을 때
When 사용자가 일부 하위 속성만 변경하면
Then 변경된 하위 속성만 오버라이드되고
And 나머지 하위 속성은 컴포넌트와 동기화 상태를 유지한다
```

### Technical Implementation Details

#### Commands
- `OverrideInstanceProperty(instanceId: InstanceId, propertyKey: string, value: any)`
- `ClearPropertyOverride(instanceId: InstanceId, propertyKey: string)`
- `SyncNonOverriddenProperties(instanceId: InstanceId, componentUpdates: PropertyUpdates)`

#### Events
- `InstancePropertyOverridden{instanceId, propertyKey, originalValue, overrideValue, timestamp}`
- `PropertyOverrideCleared{instanceId, propertyKey, restoredValue}`
- `PartialOverrideApplied{instanceId, propertyPath, overrideValue}`
- `SelectiveSyncCompleted{instanceId, syncedProperties, skippedOverrides}`

#### PropertyOverride Aggregate
```typescript
export class PropertyOverride {
  private constructor(private props: PropertyOverrideProps) {}

  static create(
    instanceId: InstanceId,
    propertyKey: string,
    originalValue: any,
    overrideValue: any
  ): PropertyOverride {
    // 오버라이드 생성 로직
  }

  updateOverrideValue(newValue: any): void {
    // 오버라이드 값 업데이트
  }

  clear(): void {
    // 오버라이드 제거
  }

  shouldSyncFromComponent(componentUpdate: PropertyUpdate): boolean {
    // 컴포넌트 업데이트 시 동기화 여부 결정
  }
}
```

#### Database Schema
```sql
-- property_overrides 테이블
CREATE TABLE property_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES component_instances(id),
  property_key VARCHAR(200) NOT NULL,
  property_path VARCHAR(500), -- 중첩 속성 경로 (예: "style.color")
  original_value JSONB,
  override_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(instance_id, property_key, property_path)
);

-- property_override_history 테이블 (감사용)
CREATE TABLE property_override_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID REFERENCES property_overrides(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cleared'
  old_value JSONB,
  new_value JSONB,
  user_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Definition of Done
- [ ] 모든 속성 타입에 대한 오버라이드 지원
- [ ] 중첩 객체 부분 오버라이드 구현
- [ ] 성능: 1000개 인스턴스 동기화 시간 < 3초
- [ ] 오버라이드 히스토리 추적 완성
- [ ] 복잡한 오버라이드 시나리오 테스트

---

## 📋 Story CS-2.2: Override Visual Indicators
**Story Points**: 4 | **Priority**: High

### User Story
**As a** 사용자  
**I want to** 오버라이드된 속성을 시각적으로 구분  
**So that** 어떤 속성이 커스터마이징되었는지 쉽게 파악할 수 있다

### Detailed Acceptance Criteria

#### AC1: 속성 패널 시각적 구분
```gherkin
Given 인스턴스 속성 패널이 열려있을 때
When 오버라이드된 속성이 있으면
Then 해당 속성에 구분 표시(아이콘, 색상)가 나타나고
And 마우스 호버 시 오버라이드 정보 툴팁이 표시되고
And 원본 값 확인 옵션이 제공된다
```

#### AC2: 캔버스 인스턴스 표시
```gherkin
Given 캔버스에 인스턴스들이 있을 때
When 인스턴스에 오버라이드가 있으면
Then 인스턴스 테두리나 코너에 표시가 나타나고
And 오버라이드 개수 표시가 제공되고
And 클릭 시 오버라이드 목록이 표시된다
```

#### AC3: 컴포넌트 라이브러리 표시
```gherkin
Given 컴포넌트 라이브러리에서
When 컴포넌트의 인스턴스들을 확인할 때
Then 각 인스턴스의 오버라이드 상태가 표시되고
And 오버라이드 통계(전체 중 몇 개 오버라이드)가 제공된다
```

#### AC4: 오버라이드 경고 및 알림
```gherkin
Given 컴포넌트가 업데이트될 때
When 오버라이드로 인해 동기화되지 않는 인스턴스가 있으면
Then 사용자에게 알림이 제공되고
And 영향받는 인스턴스 목록이 표시되고
And 개별적으로 동기화할지 선택할 수 있다
```

### Technical Implementation Details

#### UI Components
```typescript
export interface OverrideIndicatorProps {
  isOverridden: boolean;
  originalValue: any;
  overrideValue: any;
  propertyKey: string;
  onRevert?: () => void;
  onViewHistory?: () => void;
}

export function OverrideIndicator({ 
  isOverridden, 
  originalValue, 
  overrideValue,
  onRevert 
}: OverrideIndicatorProps) {
  // UI 컴포넌트 구현
}
```

#### Read Models
```typescript
export interface InstanceOverrideStatus {
  instanceId: string;
  totalProperties: number;
  overriddenProperties: number;
  overrideList: {
    propertyKey: string;
    originalValue: any;
    overrideValue: any;
    overriddenAt: Date;
  }[];
}
```

### Definition of Done
- [ ] 모든 UI 영역에서 오버라이드 표시 완성
- [ ] 시각적 디자인 시스템과 일관성 유지
- [ ] 접근성 (색맹, 스크린 리더) 고려
- [ ] 반응형 디자인 지원

---

## 📋 Story CS-2.3: Property Reset Functionality
**Story Points**: 3 | **Priority**: Medium

### User Story
**As a** 사용자  
**I want to** 오버라이드된 속성을 원본으로 되돌리기  
**So that** 실험 후 쉽게 기본 상태로 복원할 수 있다

### Detailed Acceptance Criteria

#### AC1: 개별 속성 리셋
```gherkin
Given 오버라이드된 속성이 있을 때
When 사용자가 "원본으로 되돌리기" 버튼을 클릭하면
Then 해당 속성이 컴포넌트 기본값으로 복원되고
And 오버라이드 기록이 제거되고
And 즉시 UI에 반영된다
```

#### AC2: 전체 인스턴스 리셋
```gherkin
Given 여러 속성이 오버라이드된 인스턴스가 있을 때
When 사용자가 "모든 오버라이드 제거"를 선택하면
Then 모든 오버라이드가 제거되고
And 인스턴스가 완전히 컴포넌트와 동기화되고
And 확인 대화상자가 먼저 표시된다
```

#### AC3: 선택적 리셋
```gherkin
Given 다중 선택된 속성들이 있을 때
When 사용자가 선택된 속성들을 리셋하면
Then 선택된 속성들만 원본으로 복원되고
And 나머지 오버라이드는 유지된다
```

### Technical Implementation Details

#### Commands
- `ResetPropertyOverride(instanceId: InstanceId, propertyKey: string)`
- `ResetAllOverrides(instanceId: InstanceId, confirmationToken: string)`
- `ResetSelectedOverrides(instanceId: InstanceId, propertyKeys: string[])`

#### Events
- `PropertyOverrideReset{instanceId, propertyKey, restoredValue}`
- `AllOverridesReset{instanceId, resetCount, restoredToComponent}`
- `SelectedOverridesReset{instanceId, resetProperties, preservedOverrides}`

### Definition of Done
- [ ] 모든 리셋 시나리오 구현 및 테스트
- [ ] 실행취소/재실행 지원
- [ ] 확인 대화상자 및 안전장치 완성
- [ ] 배치 리셋 성능 최적화

---

## 📊 Sprint 4 Summary

| Story | Points | Key Focus | Dependencies |
|-------|--------|-----------|--------------|
| CS-2.1 | 8 | 핵심 로직 | Sprint 3 완성 |
| CS-2.2 | 4 | UX/UI | CS-2.1 |
| CS-2.3 | 3 | 편의성 | CS-2.1, CS-2.2 |

**Total Points**: 15  
**Sprint Goal Achievement**: 완전한 인스턴스 커스터마이징 시스템

**Key Deliverables**:
- PropertyOverride Aggregate 완성
- 시각적 구분 시스템 완성  
- 사용자 친화적인 리셋 기능

**Next Sprint**: Component Synchronization (Sprint 5)
