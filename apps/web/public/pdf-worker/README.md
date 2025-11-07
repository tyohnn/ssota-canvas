# PDF.js Worker

이 디렉토리는 react-pdf의 PDF.js 워커 파일을 포함합니다.

## 자동 설정

`pnpm install` 실행 시 postinstall 스크립트가 자동으로 워커 파일을 복사합니다.

## 수동 설정

필요한 경우 다음 명령으로 수동으로 복사할 수 있습니다:

```bash
cp ../../node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf-worker/
```

## 왜 로컬 파일을 사용하나요?

- **CORS 문제 해결**: CDN에서 워커 파일을 로드할 때 CORS 오류 발생 방지
- **안정성**: 네트워크 의존성 제거
- **속도**: 로컬 파일이 CDN보다 빠름
- **오프라인 지원**: 인터넷 연결 없이도 PDF 렌더링 가능

