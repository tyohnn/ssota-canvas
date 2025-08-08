import * as path from "path";
import { BlockRegistry } from "./types.js";
import { pathExists } from "./fs.js";
import {
  CLAUDE_AGENTS_DIR,
  CLAUDE_COMMANDS_DIR,
  XBOWL_DATA_DIR,
} from "./constants.js";

export interface DiffEntry {
  kind: "missing" | "unexpected" | "ok";
  path: string;
}

export async function diffExpected(
  cwd: string,
  reg: BlockRegistry
): Promise<DiffEntry[]> {
  const expected = new Set<string>();

  for (const b of reg.blocks || []) {
    const slug = (b as any).slug || (b.metadata as any)?.slug;
    if (!slug) continue;
    switch (b.block_type) {
      case "agent":
        expected.add(path.join(cwd, CLAUDE_AGENTS_DIR, `${slug}.md`));
        break;
      case "task":
      case "checklist":
        expected.add(path.join(cwd, CLAUDE_COMMANDS_DIR, `${slug}.md`));
        break;
      case "data":
        expected.add(path.join(cwd, XBOWL_DATA_DIR, `${slug}.txt`));
        expected.add(path.join(cwd, CLAUDE_COMMANDS_DIR, `load-${slug}.md`));
        break;
      case "workflow":
        expected.add(path.join(cwd, CLAUDE_AGENTS_DIR, `workflow-${slug}.md`));
        break;
      default:
        break;
    }
  }

  const results: DiffEntry[] = [];
  for (const p of expected) {
    const exists = await pathExists(p);
    results.push({ kind: exists ? "ok" : "missing", path: p });
  }
  return results;
}
