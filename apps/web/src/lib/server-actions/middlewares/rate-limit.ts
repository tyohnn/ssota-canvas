type Bucket = { points: number[] };

const buckets = new Map<string, Bucket>();

/**
 * Rate Limiting 미들웨어
 *
 * Token bucket 알고리즘을 사용한 간단한 rate limiting
 * Serverless 환경에서 인메모리 버킷 사용 (프로세스별로 독립적)
 *
 * @param key - Rate limit을 적용할 고유 키
 * @param limit - 시간 윈도우 내 허용되는 최대 요청 수
 * @param windowMs - 시간 윈도우 (밀리초)
 * @returns true if allowed, false if rate limited
 *
 * @example
 * ```ts
 * if (!rateLimit(userId, 10, 60000)) {
 *   return err('Rate limit exceeded', { code: 'RATE_LIMIT_EXCEEDED' });
 * }
 * ```
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { points: [] };
    buckets.set(key, bucket);
  }
  // Drop old points
  bucket.points = bucket.points.filter(t => now - t <= windowMs);
  if (bucket.points.length >= limit) return false;
  bucket.points.push(now);
  return true;
}
