# Block Definitions

이 폴더는 다양한 블록 타입의 정의를 담고 있습니다. 각 블록은 사용자가 캔버스에 추가하고 관리할 수 있는 콘텐츠 단위입니다.

## 🎯 필독 문서

### 설계 원칙
**블록 정의 전에 반드시 읽어주세요**: [00-block-properties-principle.md](./00-block-properties-principle.md)

**핵심 원칙**: Properties는 **사용자가 직접 수정할 수 있는 속성만** 포함합니다.
- ✅ 사용자 입력/선택값
- ❌ 자동 fetch 메타데이터
- ❌ 렌더링 옵션
- ❌ 내부 상태

### 빠른 참조
**모든 블록의 Properties 한눈에 보기**: [BLOCK_SUMMARY.md](./BLOCK_SUMMARY.md)

## 📋 목차

### 기본 콘텐츠 블록
- [텍스트 블록](./01-text-block.md) - 일반 텍스트 스티커/메모
- [마크다운 블록](./02-markdown-block.md) - 마크다운 콘텐츠
- [도형 블록](./03-shape-block.md) - 다양한 도형

### 미디어 블록
- [이미지 블록](./04-image-block.md) - 이미지 갤러리
- [비디오 블록](./05-video-block.md) - 비디오 플레이어
- [유튜브 블록](./06-youtube-block.md) - 유튜브 임베드

### 프리뷰/링크 블록
- [URL 프리뷰 블록](./07-url-preview-block.md) - 오픈그래프 프리뷰
- [트위터 프리뷰 블록](./08-twitter-preview-block.md) - 트위터 임베드

### 개발 도구 블록
- [코드 블록](./09-code-block.md) - 코드 미리보기
- [Vercel 배포 상태 블록](./10-vercel-deployment-block.md) - Vercel 배포 상태 추적
- [깃헙 PR 블록](./11-github-pr-block.md) - GitHub PR 프리뷰
- [DB Schema 블록](./12-db-schema-block.md) - 데이터베이스 스키마 시각화

### 디자인 도구 블록
- [Shadcn Registry 블록](./13-shadcn-registry-block.md) - Shadcn 컴포넌트 레지스트리
- [Design Theme 블록](./14-design-theme-block.md) - 디자인 테마 관리

### 기타 블록
- [PDF 뷰어 블록](./15-pdf-viewer-block.md) - PDF 문서 뷰어
- [Circuit JS 블록](./16-circuit-js-block.md) - 회로 시뮬레이션

## 📖 문서 구조

각 블록 정의 문서는 다음 섹션으로 구성됩니다:

### 1. 블록 개요
- **블록 타입**: 데이터베이스 enum 값
- **설명**: 유저 입장에서 어떤 기능을 하는 블록인지

### 2. UI 정의
- **기본 UI**: 블록이 캔버스에서 어떻게 보이는지
- **기본 크기**: width, height (픽셀)
- **블록 스페이스/에디터**: 상세 편집 UI가 있는지 (없는 경우 "없음")

### 3. 입력 방식
- **추가 방식**: 기본 추가 방법
- **붙여넣기 방식**: 특정 콘텐츠 붙여넣기로 자동 생성 여부

### 4. 속성 정의 (Properties)
블록에 담겨야 하는 기본 정보와 스키마 정의

#### 기본 속성
각 속성은 다음 정보를 포함:
- **속성 키**: properties 객체의 키 이름
- **타입**: TypeScript 타입
- **설명**: 속성의 용도
- **기본값**: 초기 생성 시 기본값
- **UI Schema**: Editor Panel에서의 렌더링 정의
  - `label`: 표시 라벨
  - `inputType`: 입력 타입 (text, textarea, select, etc.)
  - `icon`: Lucide 아이콘 이름
  - `description`: 도움말
  - `order`: 렌더링 순서
  - `readonly`: 읽기 전용 여부
  - `options`: select/multi-select용 옵션 배열

#### 메타데이터 속성 (공통)
모든 블록이 공통으로 가지는 메타데이터:
- `createdAt`: 생성일 (readonly-datetime)
- `updatedAt`: 수정일 (readonly-datetime)
- `createdBy`: 작성자 프로필 (readonly-profile)

### 5. 툴바 아이템
블록 선택 시 표시되는 툴바 버튼들 (빠른 편집용)

### 6. 블록 툴
블록을 입력으로 받아 다른 블록을 출력하는 predefined 함수들
- **툴 이름**: 함수명
- **설명**: 툴의 기능
- **입력**: 현재 블록 + 추가 파라미터
- **출력**: 생성될 새 블록 타입

### 7. 구현 참조
- **Properties Interface**: Value Object 파일 경로
- **UI Schema**: UI 스키마 파일 경로
- **Block Component**: 컴포넌트 파일 경로
- **Toolbar Items**: 툴바 아이템 매퍼 코드 위치

## 🎯 텍스트 블록을 참조 기준으로 사용

텍스트 블록은 현재 가장 완벽하게 구현된 블록 타입입니다. 새로운 블록을 정의하거나 구현할 때는 텍스트 블록의 구조를 참조하세요.

**텍스트 블록 구현 위치**:
- Properties Interface: `apps/web/src/domains/block-management/shared/value-objects/block-properties/text.vo.ts`
- UI Schema: `apps/web/src/domains/block-management/shared/schemas/ui/text-block.ui-schema.ts`
- Block Component: `apps/web/src/domains/block-management/frontend/components/block/text/text-block.tsx`
- Toolbar Items: `apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx` (case 'text')

## 🔗 관련 문서
- [Epic-003: Block Management](../../../agile-planning/epics/epic-003-block-management.md)
- [Block Management Domain 설계](../../domains/block-management-domain/)
- [Block UI Schema Interface](../../../../apps/web/src/domains/block-management/shared/schemas/ui/block-ui-schema.interface.ts)
- [Block Types](../../../../apps/web/src/domains/block-management/shared/types/block-types.ts)

