import * as path from "path";
import { pathExists, readJson } from "../fs.js";
import { loadConfig } from "../config.js";
import { promises as fs } from "fs";
import {
  DEFAULT_AGENT_TEMPLATE,
  DEFAULT_COMMAND_TEMPLATE,
  DEFAULT_WORKFLOW_TEMPLATE,
  DEFAULT_DATA_LOAD_TEMPLATE,
} from "./defaults.js";

export type TemplateKind = "agent" | "command" | "workflow" | "data-load";

export async function loadTemplate(
  cwd: string,
  kind: TemplateKind
): Promise<string> {
  const cfg = await loadConfig(cwd);
  const base = path.join(cwd, cfg.paths.templates);
  const rel =
    kind === "agent"
      ? "claude/agent.md"
      : kind === "command"
        ? "claude/command.md"
        : kind === "workflow"
          ? "claude/workflow.md"
          : "data/load-data.md";
  const file = path.join(base, rel);
  if (await pathExists(file)) return fs.readFile(file, "utf8");
  switch (kind) {
    case "agent":
      return DEFAULT_AGENT_TEMPLATE;
    case "command":
      return DEFAULT_COMMAND_TEMPLATE;
    case "workflow":
      return DEFAULT_WORKFLOW_TEMPLATE;
    case "data-load":
      return DEFAULT_DATA_LOAD_TEMPLATE;
  }
}
