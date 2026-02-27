/**
 * YouTube Block Utility Functions
 */

/**
 * 상대적 시간 포맷팅
 */
export function formatRelativeTime(dateIso?: string): string {
  if (!dateIso) return '';

  const now = new Date();
  const then = new Date(dateIso);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffYear > 0) {
    return rtf.format(-diffYear, 'year');
  } else if (diffMonth > 0) {
    return rtf.format(-diffMonth, 'month');
  } else if (diffDay > 0) {
    return rtf.format(-diffDay, 'day');
  } else if (diffHour > 0) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffMin > 0) {
    return rtf.format(-diffMin, 'minute');
  } else {
    return rtf.format(-diffSec, 'second');
  }
}
