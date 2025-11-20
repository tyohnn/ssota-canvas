# Circuit JS 블록 (Circuit JS Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `circuit_js` (신규)
- **Enum**: 추가 필요
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
전자 회로를 시뮬레이션하는 블록입니다. CircuitJS 또는 유사 라이브러리를 사용하여 회로 설계 및 시뮬레이션을 제공합니다.

### 사용 사례
- 전자 회로 설계
- 회로 시뮬레이션 및 분석
- 교육용 회로 데모
- 하드웨어 프로토타이핑

## 2. UI 정의

### 기본 UI
- 회로 캔버스
  - 부품 드래그앤드롭 (저항, 커패시터, LED 등)
  - 연결선
  - 시뮬레이션 재생/일시정지
  - 전압/전류 값 표시
- 부품 라이브러리 패널

### 기본 크기
```typescript
{
  width: 500,
  height: 400
}
```

### 블록 스페이스/에디터
**있음** - 전체 회로 에디터
- 부품 추가/삭제
- 속성 편집 (저항값 등)
- 시뮬레이션 설정
- 회로 내보내기

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "Circuit JS" 선택
2. 회로 설계
3. 블록 생성

### 붙여넣기 방식
- **Circuit JSON**: 회로 정의 JSON 붙여넣기 → Circuit JS 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface CircuitJSBlockProperties {
  circuitData: string;        // JSON 또는 회로 정의 형식
  
  // 시뮬레이션 설정
  speed?: number;             // 시뮬레이션 속도
  voltage?: number;           // 공급 전압
  
  // 표시 옵션
  showValues?: boolean;       // 전압/전류 값 표시
  showGrid?: boolean;         // 그리드 표시
}
```

## 5. 툴바 아이템

- PlaySimulationToolbarItem: 시뮬레이션 재생/일시정지
- ResetCircuitToolbarItem: 회로 리셋
- ExportCircuitToolbarItem: 회로 내보내기

## 6. 블록 툴

**현재 없음**

## 7. 구현 참조

**향후 구현**

**사용 라이브러리**:
- CircuitJS (오픈소스 회로 시뮬레이터)
- 또는 커스텀 구현

## 8. 특이사항

### 회로 시뮬레이션
- WebGL 또는 Canvas 기반 렌더링
- 물리 엔진으로 전기 흐름 시뮬레이션

## 9. 향후 계획

- [ ] 3D 회로 뷰
- [ ] PCB 레이아웃 내보내기
- [ ] 아두이노 코드 생성



