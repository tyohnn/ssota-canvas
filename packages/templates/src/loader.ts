import * as path from "path";
import { promises as fs } from "fs";

import {
  DEFAULT_AGENT_TEMPLATE,
  DEFAULT_COMMAND_TEMPLATE,
  DEFAULT_DATA_LOAD_TEMPLATE,
  DEFAULT_WORKFLOW_TEMPLATE,
} from "./defaults.js";

export type TemplateKind = "agent" | "command" | "workflow" | "data-load";

export interface LoadTemplateOptions {
  templatesDir?: string;
}

export async function loadTemplate(
  cwd: string,
  kind: TemplateKind,
  options: LoadTemplateOptions = {}
): Promise<string> {
  const base = options.templatesDir
    ? path.isAbsolute(options.templatesDir)
      ? options.templatesDir
      : path.join(cwd, options.templatesDir)
    : path.join(cwd, ".xbowl/templates");

  const relative =
    kind === "agent"
      ? "claude/agent.md"
      : kind === "command"
        ? "claude/command.md"
        : kind === "workflow"
          ? "claude/workflow.md"
          : "data/load-data.md";

  const file = path.join(base, relative);
  try {
    const content = await fs.readFile(file, "utf8");
    return content;
  } catch {
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
}
