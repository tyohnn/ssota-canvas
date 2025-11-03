# Process Model: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자 (Canvas Management 연동)  
**작성일**: 2025-10-22  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), Canvas Management Domain 연동

---

## 🎯 Process Modeling Overview

Block Management Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의

이 도메인은 **Canvas Management Domain과의 연동을 통한 블록 관리 기능**을 제공하며, 주요 시나리오는 다음과 같습니다:

1. **Canvas Management 연동**: Canvas에서 블록 생성/조회/수정/삭제 요청 처리
2. **Custom Properties 관리**: 사용자가 블록에 커스텀 속성 추가/편집/삭제
3. **Property Values 관리**: 속성 값 설정/변경 및 타입별 검증
4. **Media Upload 처리**: 이미지/파일 업로드 및 Supabase Storage 연동
5. **Block Tools 실행**: 블록 타입별 특화 기능 실행 및 결과 처리

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙 (워크스페이스 격리, 속성 개수 제한, 파일 크기 제한)
- 권한 기반 필터링 로직 (RLS 정책, 워크스페이스 멤버 검증)
- 시스템 처리 흐름 (블록 생성, 속성 관리, 미디어 업로드, 툴 실행)
- 데이터 검증 규칙 (블록 타입, 속성 타입별 값 검증, 파일 형식)
- 외부 시스템 통합 (Canvas Management, Supabase Storage, Supabase Auth)

#### ✅ 선택적으로 작성 가능 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 속성 타입 선택 UI*`, `*UI Hint: 파일 드래그앤드롭 영역*`
- 원칙:
  - **최소성**: 꼭 필요한 힌트만
  - **추상성**: 구체적 컴포넌트 이름 금지
  - **선택성**: `*` 표시로 선택적 정보임을 명시

#### ❌ 작성 금지 (UI 과도 종속)
- 버튼 위치, 색상, 크기
- 애니메이션, 트랜지션 효과
- 구체적인 컴포넌트 이름 (Material-UI Select, shadcn/ui Dialog 등)
- 반응형 레이아웃 세부사항

> **참고**: 구체적인 UI/UX 설계는 Canvas Management Domain의 User Flow에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서

각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: Canvas Management Domain

Block Management Domain은 Canvas Management Domain과 연동됩니다:
- **역할**: Canvas에서 블록 정보를 직접 DB JOIN을 통해 조회, 블록 생성/수정/삭제 요청 처리
- **SSOT**: Block Management가 Block 데이터의 Single Source of Truth
- **통합**: Canvas Management가 직접 DB 조회 (별도 서비스 레이어 불필요)

### 🟪 External System: Workspace Management Domain

Block Management Domain은 Workspace Management Domain과 연동됩니다:
- **역할**: 워크스페이스 권한 관리, 멤버 정보 제공
- **SSOT**: Workspace Management가 워크스페이스의 Single Source of Truth
- **통합**: Workspace Management → Block Management (RLS 정책)

### 🟪 External System: Supabase Storage

Block Management Domain은 Supabase Storage와 연동됩니다:
- **역할**: 미디어 파일 저장 및 Public URL 생성
- **SSOT**: Supabase Storage가 미디어 파일의 Single Source of Truth
- **통합**: Block Management ↔ Supabase Storage (API 호출)

### 🟪 External System: Supabase Auth

Block Management Domain은 Supabase Auth와 연동됩니다:
- **역할**: 사용자 인증 및 작성자 정보 제공
- **SSOT**: Supabase Auth가 사용자 인증의 Single Source of Truth
- **통합**: Block Management ↔ Supabase Auth (세션 정보)

---

## 📍 Scenario 0: Canvas Management 연동

### Sequence 1: Canvas에서 블록 생성 요청 처리

**Trigger Event**: Canvas Management가 블록 생성 요청

```
🔗 Canvas Management: "새로운 블록을 생성해서 캔버스에 마운트하고 싶어"
```

**Policy**: 
- "Whenever Canvas에서 블록 생성 요청됨, then always 블록 타입 검증하기"
- "Whenever 블록 생성 완료됨, then always 타입별 기본 속성 초기화하기"
- "If 워크스페이스 권한 없음, then 생성 거부하기"

**Read Model** (시스템에서 Canvas Management에게 제공하는 정보):
- 블록 생성 가능한 타입 목록
- 블록 타입별 기본 속성 스키마
- 생성 권한 상태
- 생성 진행 상태 및 결과

**Command**: 블록 생성 요청 (Canvas Management가 입력하는 정보)
- 블록 타입 (youtube, python, markdown 등)
- 워크스페이스 ID
- 사용자 ID (생성자 정보)
- 초기 메타데이터 (선택적)
- 생성 확인

**System**: Block Manager (Backend - Security Enforcement)
- 비즈니스 로직: 블록 타입 검증, 워크스페이스 권한 확인, 기본 속성 초기화, 생성자 정보 설정
- 검증 로직: 블록 타입 유효성, 워크스페이스 접근 권한, 생성 제한 검증, 사용자 ID 유효성
- 처리 로직: 새 블록 생성, 타입별 기본 속성 설정, 생성자 정보(createdBy), 생성 시간(createdAt), 수정 시간(updatedAt) 기록

**Events**:
1. 블록이 타입별 기본 속성과 함께 생성되었다 (Block Created with Type Default Properties)
2. 블록이 검증되었다 (Block Validated)
3. 블록 타입 기본 속성이 설정되었다 (Block Type Default Property Set)

> **참고**: Canvas Management Domain에서 블록 정보 조회는 `block_mounts JOIN blocks` DB JOIN으로 직접 처리하므로, Block Management Domain에서는 별도 조회 시나리오가 불필요합니다.

---

## 📍 Scenario 1: Custom Properties 관리

### Sequence 1: 사용자가 커스텀 속성 추가

**Trigger Event**: 사용자가 커스텀 속성 추가 요청

```
👤 사용자: "블록에 새로운 속성을 추가해서 더 많은 정보를 관리하고 싶어"
```

**Policy**:
- "Whenever 커스텀 속성 추가 요청됨, then always 속성 개수 제한 확인하기 (최대 50개)"
- "Whenever 속성 추가 완료됨, then always 속성 순서 자동 설정하기"
- "If 속성 이름 중복됨, then 중복 방지하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 속성 타입 선택 옵션 (text, select, multiselect, date, image, profile 등)
- 현재 블록의 커스텀 속성 목록
- 속성 개수 제한 상태 (현재/최대)
- 속성 추가 폼 필드
- *UI Hint: 속성 타입 선택 UI, 속성 이름 입력 필드, 멀티선택 옵션 관리 UI*

**Command**: 커스텀 속성 추가 요청 (사용자가 입력하는 정보)
- 속성 이름
- 속성 타입 선택
- 속성 설명 (선택적)
- 속성 가시성 설정
- 추가 확인

**System**: Property Manager (Backend - Security Enforcement)
- 비즈니스 로직: 속성 개수 제한 검증, 속성 이름 중복 확인, 순서 자동 할당
- 검증 로직: 속성 이름 유효성, 타입 검증, 개수 제한 확인
- 처리 로직: custom_properties 배열에 새 속성 추가, properties에 빈 값 초기화

**Events**:
1. 커스텀 속성이 추가되었다 (Custom Property Added)
2. 속성 순서가 설정되었다 (Property Order Set)
3. 속성 값이 초기화되었다 (Property Value Initialized)

### Sequence 2: 사용자가 속성 타입 변경

**Trigger Event**: 사용자가 속성 타입 변경 요청

```
👤 사용자: "텍스트 속성을 선택형으로 바꿔서 옵션을 관리하고 싶어"
```

**Policy**:
- "Whenever 속성 타입 변경 요청됨, then always 기존 값 보존하기"
- "Whenever 타입 변경 완료됨, then always 렌더링 호환성 체크하기"
- "If 호환되지 않는 값 존재함, then 빈 값으로 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 속성 정보 (이름, 타입, 값)
- 변경 가능한 속성 타입 목록
- 기존 값 호환성 상태
- 타입별 설정 옵션 (선택형/멀티선택의 경우 옵션 관리)
- *UI Hint: 속성 타입 선택 UI, 옵션 관리 UI, 멀티선택 체크박스 UI*

**Command**: 속성 타입 변경 요청 (사용자가 입력하는 정보)
- 속성 ID
- 새로운 속성 타입
- 타입별 설정 (옵션, 색상 등)
- 변경 확인

**System**: Property Manager (Backend - Security Enforcement)
- 비즈니스 로직: 기존 값 보존, 타입별 설정 적용, 호환성 검사
- 검증 로직: 새 타입 유효성, 설정 옵션 검증
- 처리 로직: custom_properties에서 타입 업데이트, properties에서 값 호환성 체크

**Events**:
1. 커스텀 속성 타입이 변경되었다 (Custom Property Type Changed)
2. 속성 값이 검증되었다 (Property Value Validated)
3. 속성 설정이 업데이트되었다 (Property Configuration Updated)

---

## 📍 Scenario 2: Property Values 관리

### Sequence 1: 사용자가 블록 마운트 툴바에서 색상 속성 변경

**Trigger Event**: 사용자가 블록 마운트 툴바에서 색상 속성 변경 요청

```
👤 사용자: "텍스트 블록의 색상을 orange에서 red로 변경하고 싶어"
```

**Policy**:
- "Whenever 블록 속성 변경 요청됨, then always 속성 경로 검증하기"
- "Whenever 속성 값 변경됨, then always 타입별 값 검증하기"
- "Whenever 값 변경 완료됨, then always 편집시각 업데이트하기"
- "If 프로필 속성 변경됨, then 워크스페이스 멤버 검증하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 블록의 기본 속성 (색상, 폰트 크기, 정렬 등)
- 블록 타입별 사용 가능한 속성 옵션
- 현재 속성 값 상태
- 속성 변경 진행 상태
- *UI Hint: 블록 마운트 툴바의 색상 선택 UI, 속성별 입력 UI*

**Command**: 블록 속성 변경 요청 (사용자가 입력하는 정보)
- 블록 ID (React Flow 노드 ID)
- 속성 경로 (properties.color)
- 새로운 속성 값 (red)
- 변경 확인

**System**: Block Property Manager (Backend - Security Enforcement)
- 비즈니스 로직: 속성 경로 검증, 타입별 값 검증, 프로필 속성 멤버 검증, 값 변환
- 검증 로직: 속성 경로 유효성, 값 형식 검증, 멤버 존재 확인, 필수값 검증
- 처리 로직: properties JSONB에서 값 업데이트, 편집시각 갱신, 도메인 이벤트 발생

**Events**:
블록 속성이 업데이트되었다 (Block Property Updated)

### Sequence 2: 사용자가 커스텀 속성 값 설정

**Trigger Event**: 사용자가 커스텀 속성 값 입력 요청

```
👤 사용자: "커스텀 속성에 실제 값을 입력해서 정보를 저장하고 싶어"
```

**Policy**:
- "Whenever 커스텀 속성 값 입력됨, then always 타입별 값 검증하기"
- "Whenever 값 설정 완료됨, then always 편집시각 업데이트하기"
- "If 프로필 속성 설정됨, then 워크스페이스 멤버 검증하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 커스텀 속성 정의 (이름, 타입, 옵션)
- 속성별 입력 필드 (텍스트, 선택, 멀티선택, 날짜 등)
- 현재 속성 값
- 검증 오류 메시지 (있는 경우)
- *UI Hint: 속성별 입력 UI (텍스트박스, 드롭다운, 멀티선택 체크박스, 날짜선택기 등)*

**Command**: 커스텀 속성 값 설정 요청 (사용자가 입력하는 정보)
- 속성 ID
- 속성 값 (타입별)
- 값 설정 확인

**System**: Property Value Manager (Backend - Security Enforcement)
- 비즈니스 로직: 타입별 값 검증, 프로필 속성 멤버 검증, 값 변환
- 검증 로직: 값 형식 검증, 멤버 존재 확인, 필수값 검증
- 처리 로직: properties JSONB에서 값 업데이트, 편집시각 갱신

**Events**:
1. 속성 값이 설정되었다 (Property Value Set)
2. 속성 값이 검증되었다 (Property Value Validated)
3. 편집시각이 업데이트되었다 (Edited Time Property Auto-Updated)

---

## 📍 Scenario 3: Media Upload 처리

### Sequence 1: 사용자가 이미지 업로드

**Trigger Event**: 사용자가 이미지 업로드 요청

```
👤 사용자: "블록에 이미지를 첨부해서 시각적 정보를 추가하고 싶어"
```

**Policy**:
- "Whenever 이미지 업로드 요청됨, then always 파일 크기 제한 확인하기 (10MB)"
- "Whenever 업로드 완료됨, then always Public URL 생성하기"
- "If 업로드 실패함, then 재시도 옵션 제공하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 파일 업로드 영역
- 업로드 진행률 표시
- 지원 파일 형식 안내
- 파일 크기 제한 표시
- *UI Hint: 파일 드래그앤드롭 영역, 진행률 바*

**Command**: 이미지 업로드 요청 (사용자가 입력하는 정보)
- 이미지 파일
- 파일 설명 (선택적)
- 업로드 확인

**System**: Media Upload Manager (Backend - Security Enforcement)
- 비즈니스 로직: 파일 크기 검증, 이미지 형식 검증, 압축 처리
- 검증 로직: 파일 크기 제한, MIME 타입 검증, 보안 스캔
- 처리 로직: Supabase Storage 업로드, Public URL 생성, properties에 URL 저장

**Events**:
1. 이미지가 Supabase Storage에 업로드되었다 (Image Uploaded to Storage)
2. 미디어 Public URL이 생성되었다 (Media Public URL Generated)
3. 속성 값이 설정되었다 (Property Value Set)

### Sequence 2: 사용자가 미디어 파일 삭제

**Trigger Event**: 사용자가 미디어 파일 삭제 요청

```
👤 사용자: "업로드한 이미지를 삭제하고 다른 이미지로 교체하고 싶어"
```

**Policy**:
- "Whenever 미디어 파일 삭제 요청됨, then always properties에서 URL만 제거하기"
- "Supabase Storage에서는 파일을 삭제하지 않기 (재사용 가능성)"
- "If 다른 블록에서 같은 파일 사용 중이면, Storage에서 삭제하지 않기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 업로드된 미디어 파일 정보
- 삭제 확인 메시지
- 파일 재사용 가능성 안내
- *UI Hint: 삭제 확인 다이얼로그*

**Command**: 미디어 파일 삭제 요청 (사용자가 입력하는 정보)
- 속성 ID
- 삭제할 파일 URL
- 삭제 확인

**System**: Media Deletion Manager (Backend - Security Enforcement)
- 비즈니스 로직: properties에서 URL 제거, Storage 파일 보존
- 검증 로직: 파일 URL 유효성, 삭제 권한 확인
- 처리 로직: properties JSONB에서 URL 제거, Storage는 그대로 유지

**Events**:
1. 미디어 파일 URL이 속성에서 제거되었다 (Media File URL Removed from Property)
2. 속성 값이 초기화되었다 (Property Value Initialized)

---

## 📍 Scenario 4: Block Tools 실행

### Sequence 1: 사용자가 블록 툴 실행

**Trigger Event**: 사용자가 블록 툴 실행 요청

```
👤 사용자: "유튜브 블록에서 댓글을 가져와서 다른 블록들로 만들어주고 싶어"
```

**Policy**:
- "Whenever 툴 실행 요청됨, then always 툴 타입 검증하기"
- "Whenever 툴 실행 완료됨, then always 결과를 새 블록들로 파싱하기"
- "If 툴 실행 실패함, then 에러 메시지 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 블록 타입별 사용 가능한 툴 목록
- 툴 실행 진행 상태
- 툴 실행 결과 미리보기
- 실행 가능한 툴 표시
- *UI Hint: 툴 실행 버튼, 진행률 표시*

**Command**: 블록 툴 실행 요청 (사용자가 입력하는 정보)
- 블록 ID
- 실행할 툴 선택
- 툴 파라미터 (필요한 경우)
- 실행 확인

**System**: Block Tool Executor (Backend - Security Enforcement)
- 비즈니스 로직: 툴 타입 검증, 파라미터 검증, 실행 결과 파싱
- 검증 로직: 툴 존재 확인, 파라미터 유효성, 실행 권한
- 처리 로직: 툴 로직 실행, 결과 파싱, 새 블록 생성, Canvas Management에 새 블록 정보 전달

**Events**:
1. 블록 툴이 사용자에 의해 실행되었다 (Block Tool Executed by User)
2. 블록 툴 실행이 시작되었다 (Block Tool Execution Started)
3. 블록 툴 실행이 완료되었다 (Block Tool Execution Completed)
4. 툴 실행 결과로 새 블록들이 생성되었다 (New Blocks Created from Tool Result)
5. Canvas Management에 새 블록 정보가 전달되었다 (New Block Information Sent to Canvas Management)

### Sequence 2: AI가 블록 툴 자동 실행

**Trigger Event**: AI가 블록 툴 자동 실행 요청

```
🤖 AI Assistant: "사용자 요청에 따라 유튜브 블록에서 댓글을 자동으로 가져와서 새 블록들을 생성하고 싶어"
```

**Policy**:
- "Whenever AI가 툴 실행 요청됨, then always 사용자 권한 확인하기"
- "Whenever AI 툴 실행 완료됨, then always 실행 결과를 사용자에게 알리기"
- "If 툴 실행 실패함, then AI에게 에러 정보 전달하기"

**Read Model** (시스템에서 AI에게 제공하는 정보):
- 블록 타입별 사용 가능한 툴 목록
- 툴 실행 진행 상태
- 툴 실행 결과 미리보기
- 실행 가능한 툴 표시

**Command**: AI 블록 툴 실행 요청 (AI가 입력하는 정보)
- 블록 ID
- 실행할 툴 선택
- 툴 파라미터 (AI가 자동 설정)
- AI 실행 컨텍스트

**System**: AI Block Tool Executor (Backend - Security Enforcement)
- 비즈니스 로직: AI 권한 검증, 툴 타입 검증, 파라미터 검증, 실행 결과 파싱
- 검증 로직: AI 실행 권한, 툴 존재 확인, 파라미터 유효성
- 처리 로직: 툴 로직 실행, 결과 파싱, 새 블록 생성, Canvas Management에 새 블록 정보 전달

**Events**:
1. 블록 툴이 AI에 의해 실행되었다 (Block Tool Executed by AI)
2. 블록 툴 실행이 시작되었다 (Block Tool Execution Started)
3. 블록 툴 실행이 완료되었다 (Block Tool Execution Completed)
4. 툴 실행 결과로 새 블록들이 생성되었다 (New Blocks Created from Tool Result)
5. Canvas Management에 새 블록 정보가 전달되었다 (New Block Information Sent to Canvas Management)
6. AI에게 툴 실행 결과가 전달되었다 (Tool Execution Result Sent to AI)

---

## 💡 핵심 Policy 정리

### Canvas Management 연동 관련
1. **블록 생성 검증**: 블록 타입 유효성 및 워크스페이스 권한 확인
2. **Service 주입 호출**: Canvas Management에서 Block Management Service를 주입하여 호출
3. **DB JOIN 조회**: Canvas Management가 `block_mounts JOIN blocks`로 직접 조회 (Block Management Domain 불개입)

### Custom Properties 관리 관련
4. **속성 개수 제한**: 블록당 최대 50개 속성 제한
5. **정의-값 싱크**: custom_properties와 properties 동시 업데이트
6. **속성 타입 변경**: 기존 값 보존 및 호환성 검사

### Property Values 관리 관련
7. **타입별 값 검증**: 속성 타입에 따른 값 형식 검증
8. **프로필 속성 검증**: 워크스페이스 멤버 존재 확인
9. **Readonly 속성 자동 관리**: 작성자, 생성시각, 편집시각 자동 설정

### Media Upload 관련
10. **파일 크기 제한**: 이미지 10MB, 파일 50MB 제한
11. **보안 검증**: MIME 타입 검증 및 보안 스캔
12. **Storage 통합**: Supabase Storage API 사용
13. **파일 삭제 정책**: properties에서 URL만 제거, Storage 파일은 보존 (재사용 가능성)

### Block Tools 실행 관련
14. **툴 타입 검증**: 블록 타입별 사용 가능한 툴 확인
15. **실행 결과 파싱**: 툴 결과를 새 블록으로 변환
16. **Canvas 연동**: 새 블록 정보를 Canvas Management에 전달 (Canvas에서 마운트 및 엣지 연결 처리)
17. **AI 툴 실행**: AI가 자동으로 툴을 호출하여 실행 가능
18. **AI 권한 검증**: AI 툴 실행 시 사용자 권한 확인

---

## 🔧 기술 권장사항

### Canvas Management 연동 최적화
- **Service 주입**: Canvas Management에서 Block Management Service를 주입하여 호출
- **DB JOIN 분리**: Canvas Management가 `block_mounts JOIN blocks`로 직접 조회 (Block Management Domain 불개입)
- **공통 RLS 정책**: Canvas와 Block 모두 동일한 워크스페이스 RLS 정책 적용
- **삭제 블록 필터링**: Canvas 조회 시 deleted_at IS NULL 조건 항상 포함

### Properties JSONB 관리
- **정의-값 분리**: custom_properties(정의)와 properties(값) 분리 저장
- **GIN 인덱스**: JSONB 검색을 위한 GIN 인덱스 추가
- **싱크 유지**: 속성 삭제/변경 시 정의와 값 동시 처리

### Media Upload 처리
- **Supabase Storage**: 워크스페이스별 버킷 분리 권장
- **파일 압축**: 이미지 자동 압축 및 리사이징
- **Public URL**: Signed URL 또는 Public URL 사용
- **파일 삭제**: properties에서 URL만 제거, Storage 파일은 보존 (재사용 가능성)

### Block Tools 실행
- **툴 정의**: 코드베이스에 정적으로 정의 (블록 타입별 툴과 로직 함께 정의)
- **실행 타임아웃**: 30초 제한
- **결과 파싱**: 툴별 결과를 블록으로 변환하는 로직
- **Canvas 연동**: 새 블록 정보를 Canvas Management에 전달하여 마운트 및 엣지 연결 처리
- **AI 툴 호출**: AI가 자동으로 툴을 호출하여 실행 가능 (사용자 권한 기반)

---

## 🚀 Next Steps

이제 Block Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **DB Schema**: blocks 테이블 구조 및 RLS 정책 정의  
3. **Canvas 연동**: Canvas Management가 직접 blocks 테이블 JOIN으로 조회

### Canvas Management Domain 연동을 위한 준비사항
1. **blocks 테이블**: UUID 기반 ID, block_type, properties, custom_properties, deleted_at 필드
2. **RLS 정책**: 워크스페이스별 블록 접근 제어
3. **인덱스**: workspace_id, block_type, deleted_at 복합 인덱스 + JSONB GIN 인덱스

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2025-10-22 (Canvas Management 연동 요구사항 분석)
**참가자**: 
- **시니어 개발자**: AI Assistant (도메인 설계 및 시스템 연동 분석)
- **주니어 개발자**: 사용자 (속성 시스템 요구사항 제시 및 논의)

**워크샵 결과물**:
- [x] Canvas Management 연동을 위한 핵심 시나리오 정의 완료
- [x] Event → Policy → Read Model → Command → System → Event 순서 일관 적용
- [x] BlockDomainService 인터페이스 요구사항 시퀀스별 정의 완료
- [x] 핵심 Policy 및 기술 권장사항 정리 완료

---

*이 Process Model 문서는 Block Management Domain의 Software Design 작성을 위한 기반 자료이며, Canvas Management Domain 구현을 지원합니다.*