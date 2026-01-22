/**
 * Video Summary View 타입들 (조회용)
 *
 * View는 plain object로 정의 (클래스 불가, 직렬화 가능해야 함)
 */

/**
 * VideoSummaryView - SSOT (Single Source of Truth) for Video Summary Data
 *
 * Video Summary 정보를 나타내는 View 타입
 * - Plain object (직렬화 가능)
 * - Value Objects는 string으로 변환
 * - Date는 ISO string으로 변환
 */
export interface VideoSummaryView {
  id: string; // VideoSummaryId Value Object → string (UUID)
  videoId: string; // VideoId Value Object → string (UUID)
  language: string; // LanguageCode Value Object → string (ISO 639-1, 2자리)
  summary: string;
  keywords: string[]; // AI-extracted keywords
  createdAt: string; // Date → ISO string
  updatedAt: string; // Date → ISO string
}
