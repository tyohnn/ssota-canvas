# 오디오 블록 (Audio Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `audio`
- **Enum**: `BlockType.AUDIO`
- **데이터베이스**: `block_type_enum.audio`

### 설명
오디오 파일을 재생하거나 직접 녹음할 수 있는 블록입니다. 파형(Waveform) 시각화를 통해 오디오를 직관적으로 탐색하고, AI 기반 음성 인식 및 분석 기능을 제공합니다.

### 사용 사례
- 음성 메모 녹음 및 관리
- 팟캐스트/인터뷰 기록
- 음성 회의록 생성
- 오디오 레퍼런스 수집
- 음악/사운드 클립 저장
- 음성 기반 문서 작성

## 2. UI 정의

### 기본 UI
- 파형(Waveform) 시각화
- 재생/일시정지 컨트롤
- 시간 표시 (현재 시간 / 전체 시간)
- 재생 속도 조절 (0.5x, 1x, 1.5x, 2x)
- 볼륨 조절
- 스크러버 (드래그하여 원하는 위치로 이동)

### 기본 크기
```typescript
{
  width: 400,   // 픽셀
  height: 150   // 픽셀 (파형 + 컨트롤)
}
```

### 블록 스페이스/에디터
**있음** - 오디오 편집 옵션 제공
- **트리밍**: 시작/끝 자르기
- **볼륨 조절**: 전체 볼륨 증폭/감소
- **페이드 인/아웃**: 페이드 효과 추가
- **노이즈 제거**: AI 기반 노이즈 감소
- **메타데이터 편집**: 제목, 아티스트 등

## 3. 입력 방식

### 추가 방식 (2가지)

#### 방식 1: 파일 업로드
1. 블록 추가 메뉴에서 "오디오" 선택
2. **업로드 버튼** 클릭
3. 파일 업로드 다이얼로그 표시
4. 오디오 파일 선택 또는 드래그앤드롭
5. Supabase Storage에 업로드
6. 오디오 블록 생성

#### 방식 2: 직접 녹음
1. 블록 추가 메뉴에서 "오디오" 선택
2. **녹음 버튼** 클릭
3. 마이크 권한 요청
4. 녹음 시작 (실시간 파형 표시)
5. 녹음 종료 → Supabase Storage에 업로드
6. 오디오 블록 생성

### 붙여넣기 방식
- **오디오 파일**: 오디오 파일 확장자 감지 → 자동으로 오디오 블록 생성
- **오디오 URL**: URL이 오디오 확장자로 끝나면 오디오 블록 생성

### 드래그앤드롭 방식
- 파일 탐색기에서 오디오 파일 드래그 → 캔버스에 드롭 → 오디오 블록 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface AudioBlockProperties {
  // 오디오 정보 (유저 입력)
  audioUrl: string;                   // Supabase Storage URL
  
  // 표시 옵션
  title?: string;                     // 오디오 제목
  artist?: string;                    // 아티스트/화자
  
  // 재생 옵션
  playbackRate: number;               // 재생 속도 (0.5 ~ 2.0)
  volume: number;                     // 볼륨 (0.0 ~ 1.0)
  
  // 접근성
  transcript?: string;                // 음성 텍스트 변환 결과 (STT)
}

// Note: filename, mimeType, size, duration 등의 메타데이터는
// Supabase Storage에서 자동으로 fetch하여 블록 컴포넌트 내부에서 관리합니다.
// Properties에는 포함하지 않습니다.
```

### 기본 속성

#### 1. audioUrl
- **타입**: `string`
- **설명**: 오디오 파일 URL (Supabase Storage)
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '오디오 URL',
    inputType: 'url',
    icon: 'Music',
    description: '오디오 파일 URL (업로드 또는 녹음으로 자동 설정)',
    order: 1,
    readonly: true,  // 파일 업로드 또는 녹음으로만 설정
  }
  ```

#### 2. title
- **타입**: `string`
- **설명**: 오디오 제목 (편집 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '제목',
    inputType: 'text',
    icon: 'Heading',
    description: '오디오 제목',
    placeholder: '제목을 입력하세요...',
    order: 2,
  }
  ```

#### 3. artist
- **타입**: `string`
- **설명**: 아티스트 또는 화자 이름
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '아티스트/화자',
    inputType: 'text',
    icon: 'User',
    description: '아티스트 또는 화자 이름',
    placeholder: '이름을 입력하세요...',
    order: 3,
  }
  ```

#### 4. playbackRate
- **타입**: `number`
- **설명**: 재생 속도
- **기본값**: `1.0`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '재생 속도',
    inputType: 'select',
    icon: 'Gauge',
    description: '오디오 재생 속도',
    order: 4,
    options: [
      { value: 0.5, label: '0.5x' },
      { value: 0.75, label: '0.75x' },
      { value: 1.0, label: '1.0x (기본)' },
      { value: 1.25, label: '1.25x' },
      { value: 1.5, label: '1.5x' },
      { value: 1.75, label: '1.75x' },
      { value: 2.0, label: '2.0x' },
    ],
  }
  ```

#### 5. volume
- **타입**: `number`
- **설명**: 볼륨 (0.0 ~ 1.0)
- **기본값**: `0.8`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '볼륨',
    inputType: 'slider',
    icon: 'Volume2',
    description: '오디오 볼륨',
    order: 5,
    min: 0,
    max: 1,
    step: 0.1,
  }
  ```

#### 6. transcript
- **타입**: `string`
- **설명**: 음성 텍스트 변환 결과 (STT)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '텍스트 변환',
    inputType: 'textarea',
    icon: 'FileText',
    description: '음성을 텍스트로 변환한 결과',
    placeholder: 'AI로 자동 변환...',
    order: 6,
    readonly: true,  // AI로 자동 생성
  }
  ```

### 메타데이터 속성 (오디오 블록 전용)
- `fileType`: 파일 확장자/MIME 타입 (readonly-text, 예: 'audio/mpeg', 'audio/wav')
- `fileSize`: 파일 크기 (readonly-text, 예: '5.2 MB')
- `audioDuration`: 재생 시간 (readonly-text, 예: '3:45')

### 메타데이터 속성 (공통)
- `createdAt`: 생성일 (readonly-datetime)
- `updatedAt`: 수정일 (readonly-datetime)
- `createdBy`: 작성자 프로필 (readonly-profile)

### 속성 그룹 (UI Schema Groups)

```typescript
groups: [
  {
    id: 'basic-info',
    label: '기본 정보',
    description: '오디오의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['audioUrl', 'title', 'artist'],
  },
  {
    id: 'playback-settings',
    label: '재생 설정',
    description: '재생 속도 및 볼륨 설정',
    defaultCollapsed: false,
    order: 2,
    properties: ['playbackRate', 'volume'],
  },
  {
    id: 'transcript',
    label: '텍스트 변환',
    description: 'AI 음성 인식 결과',
    defaultCollapsed: true,
    order: 3,
    properties: ['transcript'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 4,
    properties: ['fileType', 'fileSize', 'audioDuration', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. AudioUploadToolbarItem
- **아이콘**: `Upload`
- **기능**: 오디오 파일 업로드/변경
- **동작**: 파일 업로드 다이얼로그 표시
- **업데이트**: `properties.audioUrl`

### 2. AudioRecordToolbarItem
- **아이콘**: `Mic`
- **기능**: 오디오 녹음
- **동작**: 
  1. 클릭 시 녹음 다이얼로그 표시
  2. 마이크 권한 요청
  3. 녹음 시작 (실시간 파형 표시)
  4. 녹음 종료 → 오디오 업로드 및 URL 업데이트
- **UI 컴포넌트**: `VoiceButton`, `LiveWaveform`, `MicSelector`
- **업데이트**: `properties.audioUrl`

### 3. AudioDownloadToolbarItem
- **아이콘**: `Download`
- **기능**: 오디오 파일 다운로드
- **동작**: 오디오 파일을 로컬에 저장
- **업데이트**: 없음 (일회성 액션)

### 4. AudioEditToolbarItem (향후)
- **아이콘**: `Edit`
- **기능**: 오디오 에디터 열기
- **동작**: 블록 스페이스로 오디오 에디터 표시 (트리밍, 볼륨 조절 등)

## 6. 블록 툴 (Block Tools)

### 1. 음성 → 텍스트 변환 (Speech-to-Text / STT)
- **입력**: 
  - 현재 오디오 블록
  - 언어 설정 (선택, 기본값: 자동 감지)
- **출력**: 
  - 새로운 마크다운 블록 (타임스탬프 포함 텍스트)
  - `properties.transcript` 업데이트
- **설명**: AI를 사용하여 음성을 텍스트로 변환
- **API**: 
  - OpenAI Whisper API
  - Google Cloud Speech-to-Text
  - AssemblyAI
  - ElevenLabs (음성 인식)

### 2. 오디오 내용 요약 (Summarize Audio)
- **입력**: 
  - 현재 오디오 블록 (STT 변환 후)
  - 요약 길이 파라미터 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (요약)
- **설명**: 음성을 텍스트로 변환한 후 AI로 요약
- **API**: OpenAI API (GPT-4), Anthropic API (Claude)

### 3. 오디오 번역 (Translate Audio)
- **입력**: 
  - 현재 오디오 블록 (STT 변환 후)
  - 타겟 언어 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (번역된 텍스트)
- **설명**: 음성을 텍스트로 변환한 후 AI로 번역
- **API**: OpenAI API (GPT-4), Google Translate API

### 4. 타임스탬프 기반 챕터 생성 (Generate Chapters)
- **입력**: 
  - 현재 오디오 블록 (STT 변환 후)
- **출력**: 
  - 새로운 마크다운 블록 (챕터 목록 및 타임스탬프)
- **설명**: AI를 사용하여 오디오 내용을 분석하고 챕터 생성
- **API**: OpenAI API, AssemblyAI (Auto Chapters)

### 5. 오디오 찾기 (Search Audio)
- **입력**: 
  - 현재 오디오 블록
  - 검색 쿼리 (string)
- **출력**: 
  - 해당 텍스트가 포함된 타임스탬프 목록
- **설명**: STT 결과에서 키워드 검색 및 타임스탬프 추출
- **API**: 없음 (클라이언트 사이드 검색)

### 6. 오디오 생성 (Generate Audio / TTS)
- **입력**: 
  - 텍스트 입력 (string)
  - 음성 모델 선택 (선택)
  - 음성 스타일 파라미터 (선택)
- **출력**: 
  - 새로운 오디오 블록 (생성된 오디오)
- **설명**: 텍스트를 음성으로 변환 (TTS)
- **API**: 
  - ElevenLabs API
  - OpenAI TTS API
  - Google Cloud Text-to-Speech

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/audio.vo.ts
```
**(향후 구현)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/audio-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/audio/audio-block.tsx
```
**(향후 구현)**

**사용 라이브러리**:
- **파형 시각화**: 
  - `@workspace/ui/components/eleven-labs/waveform.tsx` (AudioScrubber)
  - `@workspace/ui/components/eleven-labs/live-waveform.tsx` (LiveWaveform)
- **녹음 UI**: 
  - `@workspace/ui/components/eleven-labs/voice-button.tsx` (VoiceButton)
  - `@workspace/ui/components/eleven-labs/mic-selector.tsx` (MicSelector)
- **오디오 재생**: HTML5 Audio API + Web Audio API
- **파일 업로드**: `@workspace/ui/hooks/use-file-upload` (커스텀 훅)
- **스토리지**: Supabase Storage (`@/domains/storage/hooks/use-supabase-storage`)

### 오디오 재생 구현 예시

```typescript
// AudioBlock 컴포넌트 내부
import { AudioScrubber } from '@workspace/ui/components/eleven-labs/waveform';
import { useState, useRef, useEffect } from 'react';

export function AudioBlock({ properties }: AudioBlockProps) {
  const { audioUrl, playbackRate, volume } = properties;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // 오디오 로드 시 파형 데이터 생성
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    const audioContext = new AudioContext();
    
    fetch(audioUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => audioContext.decodeAudioData(buffer))
      .then(decodedData => {
        // 파형 데이터 추출
        const data = extractWaveformData(decodedData);
        setWaveformData(data);
      });
  }, [audioUrl]);

  // 재생/일시정지
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 시간 업데이트
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  // 스크러버 시크
  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="audio-block">
      {/* 숨겨진 오디오 엘리먼트 */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* 파형 스크러버 */}
      <AudioScrubber
        data={waveformData}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        height={80}
        barWidth={3}
        barGap={1}
        barRadius={1}
      />

      {/* 재생 컨트롤 */}
      <div className="controls">
        <Button onClick={togglePlay}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
    </div>
  );
}
```

### 녹음 구현 예시

```typescript
// AudioRecordToolbarItem 컴포넌트
import { VoiceButton } from '@workspace/ui/components/eleven-labs/voice-button';
import { LiveWaveform } from '@workspace/ui/components/eleven-labs/live-waveform';
import { MicSelector } from '@workspace/ui/components/eleven-labs/mic-selector';
import { useState, useRef } from 'react';

export function AudioRecordToolbarItem({ blockId, blockData }: ToolbarItemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        // Supabase Storage에 업로드
        const audioUrl = await uploadAudioToStorage(audioBlob);

        // 블록 속성 업데이트
        await updateProperty(blockId, 'properties.audioUrl', audioUrl, blockData);

        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsDialogOpen(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <>
      <ToolbarButton
        icon={<Mic />}
        tooltip="녹음"
        onClick={() => setIsDialogOpen(true)}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>오디오 녹음</DialogTitle>
            <DialogDescription>
              마이크를 선택하고 녹음을 시작하세요
            </DialogDescription>
          </DialogHeader>

          {/* 마이크 선택 */}
          <MicSelector
            value={selectedDeviceId}
            onValueChange={setSelectedDeviceId}
          />

          {/* 실시간 파형 */}
          <div className="h-32 bg-muted rounded-lg p-4">
            <LiveWaveform
              active={isRecording}
              deviceId={selectedDeviceId}
              mode="scrolling"
              height={80}
            />
          </div>

          {/* 녹음 버튼 */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1">
                <Mic className="mr-2 h-4 w-4" />
                녹음 시작
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                <Square className="mr-2 h-4 w-4" />
                녹음 중지
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'audio' 추가 예정)

## 8. 특이사항 및 주의사항

### 파일 업로드
- **최대 파일 크기**: 50MB (설정 가능)
- **지원 포맷**: MP3, WAV, M4A, OGG, WEBM, FLAC
- **Supabase Storage**: 프로젝트별 버킷에 저장
- **파일명 충돌 방지**: UUID 기반 파일명 생성
- **자동 변환**: WebM → MP3 변환 (브라우저 호환성)

### 녹음 기능
- **마이크 권한**: 브라우저 마이크 권한 필수
- **녹음 포맷**: WebM (Opus 코덱)
- **실시간 파형**: `LiveWaveform` 컴포넌트 사용
- **마이크 선택**: `MicSelector` 컴포넌트로 입력 장치 선택
- **최대 녹음 시간**: 30분 (설정 가능)

### 파형 생성
- **Web Audio API**: AudioContext를 사용하여 파형 데이터 추출
- **데이터 샘플링**: 성능을 위해 100~200개 포인트로 다운샘플링
- **캐싱**: 파형 데이터는 로컬 스토리지 또는 DB에 캐싱
- **시각화**: `AudioScrubber` 컴포넌트로 인터랙티브 파형 표시

### 음성 인식 (STT)
- **API 선택**: OpenAI Whisper API 권장 (정확도 높음)
- **언어 감지**: 자동 언어 감지 지원
- **타임스탬프**: 단어/문장 수준 타임스탬프 포함
- **Rate Limit**: API 호출 제한 고려 (큰 파일은 서버에서 처리)
- **비용 최적화**: 파일 크기에 따라 청구되므로 압축 권장

### 성능 최적화
- **Lazy Loading**: 오디오 파일은 블록이 뷰포트에 들어올 때 로드
- **스트리밍**: 큰 파일은 스트리밍 재생
- **파형 캐싱**: 파형 데이터는 한 번만 생성하고 재사용
- **메모리 관리**: AudioContext 및 MediaStream 정리

### 보안
- **MIME 타입 검증**: 실제 파일 타입 확인
- **파일 크기 제한**: 서버 사이드에서도 검증
- **RLS 정책**: 워크스페이스별 파일 접근 제어
- **재생 권한**: 공개/비공개 설정

### 접근성
- **키보드 컨트롤**: Space (재생/일시정지), 방향키 (시간 이동)
- **스크린 리더**: 오디오 정보 읽어주기 (제목, 재생 시간 등)
- **텍스트 대안**: STT로 변환된 텍스트 제공

## 9. 향후 계획

- [ ] **오디오 편집**: 트리밍, 페이드, 노이즈 제거
- [ ] **플레이리스트**: 여러 오디오를 순서대로 재생
- [ ] **북마크**: 특정 시간대에 북마크 추가
- [ ] **댓글/주석**: 타임스탬프 기반 댓글 기능
- [ ] **협업 기능**: 실시간 공동 듣기 및 토론
- [ ] **AI 분석**: 
  - 화자 구분 (Speaker Diarization)
  - 감정 분석 (Sentiment Analysis)
  - 키워드 추출
  - 요약 생성
- [ ] **음악 분석**: BPM, 키, 장르 자동 감지
- [ ] **배경음악 분리**: 음성과 배경음악 분리
- [ ] **다국어 자막**: 자동 번역 자막 생성

---

## 문서 작성 이력

### 2025-11-06: 초안 작성
- **작성자**: AI Assistant
- **목적**: 오디오 블록 정의 문서 생성
- **주요 내용**:
  - 파일 업로드 및 직접 녹음 기능
  - 파형 시각화 (AudioScrubber, LiveWaveform)
  - AI 기반 음성 인식 및 분석 툴
  - Supabase Storage 통합
  - ElevenLabs 컴포넌트 활용

