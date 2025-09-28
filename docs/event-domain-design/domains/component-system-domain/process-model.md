# Component System Domain - Process Model

## 🎯 Process Modeling Overview
Component System Domain의 핵심 프로세스를 Command → Policy → System → Event 패턴으로 정의

---

## 📍 Process 1: 컴포넌트 생성 및 인스턴스 변환

### Scenario: 사용자가 기존 일반 블럭을 컴포넌트로 변환

```
👤 사용자: "이 이벤트 블럭을 다른 곳에서도 재사용하고 싶어. 컴포넌트로 만들어야겠어."
```

**Command**: 블럭을 컴포넌트로 변환 (Convert Block to Component)
- sourceBlockId: targetBlock
- componentName: "이벤트 블럭"
- includeCustomProperties: true
- preserveConnections: false (엣지는 인스턴스에만 유지)

**Read Model** (필요 정보):
- 소스 블럭의 모든 속성 (기본 + 커스텀)
- 소스 블럭의 현재 스타일 정보
- 소스 블럭이 마운트된 모든 페이지 목록
- 소스 블럭의 연결된 엣지 정보

**Policy**: 컴포넌트 생성 시 원본 변환 규칙
- "컴포넌트가 생성되면 원본 블럭은 즉시 첫 번째 인스턴스가 된다"
- "모든 커스텀 속성은 컴포넌트에 포함되어야 한다"  
- "인스턴스는 컴포넌트와 즉시 동기화되어야 한다"
- "페이지별 위치와 크기 정보는 인스턴스에 보존된다"
- "엣지 연결은 인스턴스에만 유지되고 컴포넌트에는 포함되지 않는다"

**System**: Component Manager

**Events**:
1. 컴포넌트 블럭이 정의되었다 (Component Block Defined)
2. 컴포넌트 커스텀 속성이 복사되었다 (Component Custom Properties Copied)
3. 원본 블럭이 인스턴스로 변환되었다 (Source Block Converted to Instance)
4. 인스턴스가 컴포넌트와 동기화되었다 (Instance Synced with Component)
5. 컴포넌트가 라이브러리에 등록되었다 (Component Registered in Library)

---

## 📍 Process 2: 새 인스턴스 생성

### Scenario: 사용자가 컴포넌트를 캔버스에 추가

```
👤 사용자: "컴포넌트 라이브러리에서 이벤트 블럭을 가져와서 새로운 이벤트를 만들어야지"
```

**Command**: 컴포넌트 인스턴스 생성 (Create Component Instance)
- componentId: selectedComponent  
- targetPageId: currentPageId
- position: (x, y)

**Read Model**:
- 컴포넌트의 모든 속성과 기본값
- 컴포넌트의 스타일 정보
- 타겟 페이지의 다음 Z-Order 값

**Policy**: 인스턴스 초기화 규칙
- "새 인스턴스는 컴포넌트의 모든 속성을 기본값으로 복사한다"
- "커스텀 속성도 모두 포함되어야 한다"
- "스타일-속성 연동 규칙이 즉시 적용되어야 한다"
- "인스턴스는 생성과 동시에 페이지에 마운트된다"

**System**: Component Manager

**Events**:
1. 인스턴스 블럭이 생성되었다 (Instance Block Created)
2. 인스턴스가 컴포넌트와 동기화되었다 (Instance Synced with Component)
3. 인스턴스가 페이지에 마운트되었다 (Instance Mounted to Page)
4. 스타일-속성 연동 규칙이 적용되었다 (Style-Property Rules Applied)

---

## 📍 Process 3: 인스턴스 동기화 (컴포넌트 변경 시)

### Scenario: 컴포넌트가 수정되어 모든 인스턴스 업데이트 필요

```
👤 사용자: "이벤트 블럭 컴포넌트에 '비즈니스 임팩트' 속성을 추가했어. 모든 인스턴스에 반영되어야 해"
```

**Command**: 인스턴스 동기화 실행 (Sync Instances with Component)
- componentId: modifiedComponent
- syncScope: "all" | "selected_instances"
- forceOverride: false (오버라이드된 속성은 유지)

**Read Model**:
- 컴포넌트의 현재 속성 스키마
- 해당 컴포넌트의 모든 인스턴스 목록
- 각 인스턴스의 오버라이드 상태 맵

**Policy**: 선택적 동기화 규칙  
- "오버라이드되지 않은 속성만 컴포넌트 값으로 업데이트한다"
- "새로 추가된 속성은 모든 인스턴스에 기본값으로 추가한다"
- "컴포넌트에서 삭제된 속성은 인스턴스에서도 소프트 삭제한다"
- "스타일-속성 연동 규칙 변경 시 모든 인스턴스에 재적용한다"
- "동기화 실패 시 해당 인스턴스만 스킵하고 계속 진행한다"

**System**: Component Sync Manager

**Events**:
1. 인스턴스 동기화가 시작되었다 (Instance Sync Started)
2. 인스턴스 속성이 업데이트되었다 (Instance Property Updated from Component)
3. 새 속성이 인스턴스에 추가되었다 (New Property Added to Instance)
4. 삭제된 속성이 소프트 삭제되었다 (Deleted Property Soft Removed from Instance)
5. 스타일-속성 규칙이 재적용되었다 (Style-Property Rules Reapplied)
6. 인스턴스 동기화가 완료되었다 (Instance Sync Completed)
7. 동기화 실패가 발생했다 (Instance Sync Failed)

---

## 📍 Process 4: 속성 오버라이드

### Scenario: 사용자가 인스턴스의 특정 속성을 커스터마이징

```
👤 사용자: "이 이벤트 블럭의 텍스트를 '결제가 완료되었다'로 바꾸고, 서브도메인을 '결제'로 설정해야겠어"
```

**Command**: 인스턴스 속성 오버라이드 (Override Instance Property)  
- instanceId: targetInstance
- propertyKey: "text" | "subdomain"
- propertyValue: "결제가 완료되었다" | "결제"
- markAsOverridden: true

**Read Model**:
- 인스턴스의 현재 속성값
- 컴포넌트의 해당 속성 기본값
- 현재 오버라이드 상태 맵
- 해당 속성의 스타일 연동 규칙

**Policy**: 오버라이드 관리 규칙
- "오버라이드된 속성은 향후 컴포넌트 동기화에서 제외한다"
- "오버라이드 상태는 시각적으로 구분 표시한다"
- "스타일-속성 연동 규칙은 오버라이드된 값에도 적용한다"
- "오버라이드 히스토리를 기록하여 되돌리기 가능하게 한다"

**System**: Property Override Manager

**Events**:
1. 인스턴스 속성이 오버라이드되었다 (Instance Property Overridden)
2. 오버라이드 상태가 표시되었다 (Override Status Visualized)  
3. 스타일-속성 규칙이 적용되었다 (Style-Property Rule Applied to Override)
4. 오버라이드 히스토리가 기록되었다 (Override History Recorded)

---

## 📍 Process 5: 속성 오버라이드 리셋

### Scenario: 사용자가 오버라이드를 취소하고 컴포넌트 기본값으로 되돌리기

```
👤 사용자: "역시 서브도메인은 원래대로 '주문관리'가 맞는 것 같아. 오버라이드를 취소하자"
```

**Command**: 인스턴스 속성 리셋 (Reset Instance Property)
- instanceId: targetInstance  
- propertyKey: "subdomain"
- resetToComponentDefault: true

**Read Model**:
- 컴포넌트의 해당 속성 기본값
- 인스턴스의 현재 오버라이드 상태
- 오버라이드 히스토리

**Policy**: 리셋 규칙
- "리셋된 속성은 컴포넌트 기본값으로 즉시 변경한다"
- "오버라이드 상태를 제거하여 향후 동기화에 포함시킨다"
- "스타일-속성 연동 규칙을 새 값에 적용한다"
- "리셋 액션도 히스토리에 기록한다"

**System**: Property Override Manager

**Events**:
1. 인스턴스 속성이 리셋되었다 (Instance Property Reset)
2. 오버라이드 상태가 제거되었다 (Override Status Removed)
3. 컴포넌트 기본값이 적용되었다 (Component Default Value Applied)
4. 스타일-속성 규칙이 재적용되었다 (Style-Property Rule Reapplied)

---

## 📍 Process 6: 컴포넌트 삭제 및 인스턴스 분리

### Scenario: 컴포넌트가 더 이상 필요 없어서 삭제하기

```
👤 사용자: "이 컴포넌트는 더 이상 안 쓸 것 같아. 삭제하고 기존 인스턴스들은 일반 블럭으로 만들자"
```

**Command**: 컴포넌트 삭제 (Delete Component)
- componentId: targetComponent
- detachInstances: true
- confirmInstanceCount: 15 (안전장치)

**Read Model**:
- 해당 컴포넌트의 모든 인스턴스 목록
- 각 인스턴스의 현재 속성 상태 (오버라이드 포함)
- 인스턴스들의 페이지 마운트 정보

**Policy**: 안전한 삭제 규칙
- "삭제 전 인스턴스 개수를 사용자에게 확인받는다"
- "모든 인스턴스를 일반 블럭으로 변환한다"
- "오버라이드된 속성도 모두 보존한다"
- "페이지별 위치, 크기, 엣지 연결 정보는 그대로 유지한다"
- "변환 과정에서 실패한 인스턴스가 있으면 전체 삭제를 중단한다"

**System**: Component Lifecycle Manager

**Events**:
1. 컴포넌트 삭제가 요청되었다 (Component Deletion Requested)
2. 인스턴스 변환이 시작되었다 (Instance Conversion Started)
3. 인스턴스가 일반 블럭으로 분리되었다 (Instance Detached to Regular Block)
4. 모든 인스턴스가 변환되었다 (All Instances Converted)
5. 컴포넌트가 삭제되었다 (Component Deleted)
6. 컴포넌트 삭제가 실패했다 (Component Deletion Failed)

---

## 📍 Process 7: 개별 인스턴스 분리 (Detach)

### Scenario: 사용자가 특정 인스턴스만 컴포넌트에서 분리하여 일반 블럭으로 만들기

```
👤 사용자: "이 인스턴스는 이제 독립적으로 관리하고 싶어. 컴포넌트에서 분리해서 일반 블럭으로 만들자"
```

**Command**: 인스턴스 분리 (Detach Instance from Component)
- instanceId: targetInstance
- preserveProperties: true (모든 속성 보존)
- preserveOverrides: true (오버라이드 상태도 일반 속성으로 변환)
- confirmDetachment: true (사용자 확인)

**Read Model**:
- 인스턴스의 모든 속성 (기본 + 오버라이드)
- 인스턴스의 페이지별 위치, 크기 정보
- 인스턴스의 연결된 엣지 정보
- 컴포넌트 정보 (분리 후 참조 제거용)

**Policy**: 안전한 인스턴스 분리 규칙
- "분리된 인스턴스는 모든 속성을 일반 블럭 속성으로 변환한다"
- "오버라이드된 속성은 최종 값으로 고정된다"
- "페이지별 위치, 크기, 엣지 연결은 그대로 유지된다"
- "분리 후에는 컴포넌트 동기화에서 제외된다"
- "분리 작업은 되돌릴 수 없으므로 사용자 확인이 필요하다"

**System**: Component Lifecycle Manager

**Events**:
1. 인스턴스 분리가 요청되었다 (Instance Detachment Requested)
2. 인스턴스 속성이 일반 블럭으로 변환되었다 (Instance Properties Converted to Regular Block)
3. 오버라이드 상태가 최종 값으로 고정되었다 (Override Values Finalized)
4. 인스턴스가 컴포넌트에서 분리되었다 (Instance Detached from Component)
5. 일반 블럭이 생성되었다 (Regular Block Created from Instance)
6. 인스턴스 분리가 완료되었다 (Instance Detachment Completed)

---

## 💡 핵심 Policy 정리

### 동기화 관련
1. **선택적 동기화**: 오버라이드된 속성은 동기화에서 제외
2. **새 속성 전파**: 컴포넌트에 추가된 속성은 모든 인스턴스에 자동 추가
3. **삭제된 속성 처리**: 소프트 삭제로 데이터 손실 방지

### 오버라이드 관리
4. **시각적 구분**: 오버라이드된 속성은 UI에서 명확히 표시
5. **히스토리 추적**: 모든 오버라이드 변경 사항 기록
6. **스타일 규칙 적용**: 오버라이드 값에도 스타일-속성 연동 규칙 적용

### 안전장치
7. **확인 프로세스**: 컴포넌트 삭제 시 영향 받을 인스턴스 수 확인
8. **원자적 연산**: 변환 실패 시 전체 롤백
9. **데이터 보존**: 인스턴스 분리 시 모든 속성과 연결 정보 유지

### 인스턴스 분리 관련
10. **개별 분리**: 인스턴스별로 독립적으로 컴포넌트에서 분리 가능
11. **오버라이드 고정**: 분리 시 오버라이드 값이 일반 속성으로 변환
12. **되돌리기 불가**: 분리는 비가역적 작업으로 사용자 확인 필수

---

## 🔧 기술 권장사항

### 성능 최적화
- **배치 처리**: 다수 인스턴스 동기화 시 배치 단위로 처리
- **비동기 처리**: 대량 인스턴스 변환 시 백그라운드 작업
- **진행률 표시**: 장시간 작업 시 사용자에게 진행 상황 알림

### 데이터 일관성
- **트랜잭션 관리**: 다중 인스턴스 업데이트 시 ACID 보장
- **락 메커니즘**: 동시 편집 방지를 위한 낙관적/비관적 락
- **이벤트 순서 보장**: 동기화 이벤트의 순차 처리

---

## 🚀 Next Steps

Component System Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환  
2. **Integration Points**: Visual Canvas Domain과의 연결점 정의
3. **Performance Analysis**: 대량 인스턴스 처리 최적화 방안
