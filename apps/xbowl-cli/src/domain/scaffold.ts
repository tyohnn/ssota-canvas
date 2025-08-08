import * as path from "path";
import { ensureDir, pathExists, writeJson, writeText } from "./fs.js";
import {
  CLAUDE_AGENTS_DIR,
  CLAUDE_COMMANDS_DIR,
  XBOWL_CONFIG_FILE,
  XBOWL_DATA_DIR,
  XBOWL_REGISTRY_FILE,
} from "./constants.js";
import {
  DEFAULT_AGENT_TEMPLATE,
  DEFAULT_COMMAND_TEMPLATE,
  DEFAULT_WORKFLOW_TEMPLATE,
} from "./templates/defaults.js";
import { DEFAULT_DATA_LOAD_TEMPLATE } from "./templates/defaults.js";

export async function ensureScaffold(
  cwd: string
): Promise<{ created: string[] }> {
  const created: string[] = [];

  const dirs = [
    CLAUDE_AGENTS_DIR,
    CLAUDE_COMMANDS_DIR,
    XBOWL_DATA_DIR,
    ".xbowl/templates/claude",
    ".xbowl/templates/data",
    ".xbowl/artifacts",
    ".xbowl/sessions",
    ".xbowl/cache",
    ".xbowl/locks",
  ];
  for (const d of dirs) {
    const abs = path.join(cwd, d);
    const ok = await ensureDir(abs);
    if (ok) created.push(d);
  }

  const configFile = path.join(cwd, XBOWL_CONFIG_FILE);
  if (!(await pathExists(configFile))) {
    await writeJson(configFile, { $schema: "https://schema.xbowl.dev/config" });
    created.push(XBOWL_CONFIG_FILE);
  }

  const regFile = path.join(cwd, XBOWL_REGISTRY_FILE);
  if (!(await pathExists(regFile))) {
    await writeJson(regFile, {
      version: "1",
      workspace: {},
      blocks: [],
      edges: [],
    });
    created.push(XBOWL_REGISTRY_FILE);
  }

  const stateFile = path.join(cwd, ".xbowl/state.json");
  if (!(await pathExists(stateFile))) {
    await writeJson(stateFile, { lastSyncAt: null, fileMap: {}, remote: {} });
    created.push(".xbowl/state.json");
  }

  // default templates
  const agentTpl = path.join(cwd, ".xbowl/templates/claude/agent.md");
  if (!(await pathExists(agentTpl))) {
    await writeText(agentTpl, DEFAULT_AGENT_TEMPLATE);
    created.push(".xbowl/templates/claude/agent.md");
  }
  const cmdTpl = path.join(cwd, ".xbowl/templates/claude/command.md");
  if (!(await pathExists(cmdTpl))) {
    await writeText(cmdTpl, DEFAULT_COMMAND_TEMPLATE);
    created.push(".xbowl/templates/claude/command.md");
  }
  const wfTpl = path.join(cwd, ".xbowl/templates/claude/workflow.md");
  if (!(await pathExists(wfTpl))) {
    await writeText(wfTpl, DEFAULT_WORKFLOW_TEMPLATE);
    created.push(".xbowl/templates/claude/workflow.md");
  }
  const dataLoadTpl = path.join(cwd, ".xbowl/templates/data/load-data.md");
  if (!(await pathExists(dataLoadTpl))) {
    await writeText(dataLoadTpl, DEFAULT_DATA_LOAD_TEMPLATE);
    created.push(".xbowl/templates/data/load-data.md");
  }

  return { created };
}
