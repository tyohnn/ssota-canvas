import * as path from "path";
import { promises as fs } from "fs";
import {
  CLAUDE_AGENTS_DIR,
  CLAUDE_COMMANDS_DIR,
  XBOWL_DATA_DIR,
} from "./constants.js";
import { loadRegistry } from "./registry.js";
import { pathExists } from "./fs.js";

async function countFiles(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).length;
  } catch {
    return 0;
  }
}

export async function getStatus(cwd: string) {
  const hasXbowl = await pathExists(path.join(cwd, ".xbowl"));
  const hasClaude = await pathExists(path.join(cwd, ".claude"));
  const registry = await loadRegistry(cwd);
  const agents = await countFiles(path.join(cwd, CLAUDE_AGENTS_DIR));
  const commands = await countFiles(path.join(cwd, CLAUDE_COMMANDS_DIR));
  const data = await countFiles(path.join(cwd, XBOWL_DATA_DIR));
  return {
    hasXbowl,
    hasClaude,
    registry,
    generated: { agents, commands, data },
  } as const;
}
