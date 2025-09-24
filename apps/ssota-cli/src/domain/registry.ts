import * as path from "path";
import { readJson, writeJson, pathExists } from "./fs.js";
import { BlockRegistry } from "./types.js";
import { XBOWL_REGISTRY_FILE } from "./constants.js";

const EMPTY_REGISTRY: BlockRegistry = { blocks: [] };

export async function loadRegistry(cwd: string): Promise<BlockRegistry> {
  const file = path.join(cwd, XBOWL_REGISTRY_FILE);
  if (!(await pathExists(file))) return EMPTY_REGISTRY;
  return await readJson<BlockRegistry>(file);
}

export async function saveRegistry(
  cwd: string,
  registry: BlockRegistry
): Promise<void> {
  const file = path.join(cwd, XBOWL_REGISTRY_FILE);
  await writeJson(file, registry);
}
