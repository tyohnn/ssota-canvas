import * as path from 'path';
import { promises as fs } from 'fs';

export interface CollectResult {
  total: number;
  byClass: Record<string, number>;
}

export async function collectArtifacts(cwd: string): Promise<CollectResult> {
  const base = path.join(cwd, '.ssota/artifacts');
  const byClass: Record<string, number> = {};
  let total = 0;
  try {
    const classes = await fs.readdir(base, { withFileTypes: true });
    for (const cls of classes) {
      if (!cls.isDirectory()) continue;
      const dir = path.join(base, cls.name);
      const files = await fs.readdir(dir, { withFileTypes: true });
      const count = files.filter(f => f.isFile()).length;
      if (count > 0) byClass[cls.name] = count;
      total += count;
    }
  } catch {
    // ignore if missing
  }
  return { total, byClass };
}
