type Bucket = { points: number[] };

const buckets = new Map<string, Bucket>();

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
  bucket.points = bucket.points.filter((t) => now - t <= windowMs);
  if (bucket.points.length >= limit) return false;
  bucket.points.push(now);
  return true;
}
