# PDF 뷰어 블록 (PDF Viewer Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `pdf`
- **Enum**: `BlockType.PDF`
- **데이터베이스**: `block_type_enum.pdf`

### 설명
PDF 문서를 표시하는 블록입니다. 페이지 네비게이션, 확대/축소, 검색, 주석 기능을 제공합니다.

### 사용 사례
- 문서 리뷰 및 공유
- 논문 정리
- 계약서/제안서 저장
- 기술 문서 아카이브

## 2. UI 정의

### 기본 UI
- PDF 뷰어
  - 페이지 미리보기
  - 페이지 네비게이션
  - 확대/축소 컨트롤
  - 검색 기능
  - 다운로드 버튼
  - 인쇄 버튼

### 기본 크기
```typescript
{
  width: 300,
  height: 400
}
```

### 블록 스페이스/에디터
**있음** - 전체 화면 PDF 뷰어
- 페이지 썸네일
- 책갈피
- 주석 및 하이라이트
- 텍스트 선택 및 복사

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "PDF" 선택
2. PDF 파일 업로드 또는 URL 입력
3. 블록 생성

### 붙여넣기 방식
- **PDF 파일**: 파일 복사 후 붙여넣기 → PDF 블록 생성
- **PDF URL**: `.pdf`로 끝나는 URL → PDF 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface PDFBlockProperties {
  url: string;
  filename?: string;
  pageCount?: number;
  currentPage: number;
  zoom: number;                // 100% = 1.0
  
  // 표시 옵션
  showPageNav?: boolean;
  showToolbar?: boolean;
  enableAnnotations?: boolean;
}
```

### 메타데이터 속성 (PDF 블록 전용)
- `fileType`: 파일 확장자/MIME 타입 (readonly-text, 예: 'application/pdf')
- `fileSize`: 파일 크기 (readonly-text, 예: '12.5 MB')
- `pageCount`: 총 페이지 수 (readonly-text, 예: '45 pages')

### 메타데이터 속성 (공통)
- `createdAt`: 생성일 (readonly-datetime)
- `updatedAt`: 수정일 (readonly-datetime)
- `createdBy`: 작성자 프로필 (readonly-profile)

## 5. 툴바 아이템

- PageNavToolbarItem: 페이지 이동
- ZoomToolbarItem: 확대/축소
- DownloadPDFToolbarItem: PDF 다운로드

## 6. 블록 툴

**현재 없음**

향후:
- PDF → 텍스트 추출 (OCR)
- PDF → 이미지 변환

## 7. 구현 참조

**향후 구현**

**사용 라이브러리**:
- `react-pdf` (PDF.js 기반)
- `pdfjs-dist`

## 8. 특이사항

### PDF 렌더링
- Canvas 기반 렌더링
- 페이지별 Lazy Loading
- 대용량 PDF는 가상 스크롤링

## 9. 향후 계획

- [ ] PDF 주석 및 하이라이트
- [ ] PDF 편집 (페이지 추가/삭제/재정렬)
- [ ] PDF 폼 작성

