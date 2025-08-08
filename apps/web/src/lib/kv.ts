type Entry<T> = { value: T; expiresAt: number };

class TTLMap<T> {
  private store = new Map<string, Entry<T>>();

  set(key: string, value: T, ttlMs: number) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  delete(key: string) {
    this.store.delete(key);
  }
}

// Global singleton for process
export const kvCliAuth = new TTLMap<string>();
