import * as path from "path";
import { pathExists, readJson, writeJson } from "./fs.js";

export interface XbowlState {
  lastSyncAt: string | null;
  fileMap: Record<string, unknown>;
  remote: { workspaceEtag?: string };
}

const DEFAULT_STATE: XbowlState = {
  lastSyncAt: null,
  fileMap: {},
  remote: {},
};

export async function loadState(cwd: string): Promise<XbowlState> {
  const file = path.join(cwd, ".xbowl/state.json");
  if (!(await pathExists(file))) return { ...DEFAULT_STATE };
  return await readJson<XbowlState>(file);
}

export async function saveState(cwd: string, state: XbowlState): Promise<void> {
  const file = path.join(cwd, ".xbowl/state.json");
  await writeJson(file, state);
}
