import { loadConfig } from "../config.js";
import {
  loadTemplate as baseLoadTemplate,
  type TemplateKind,
} from "@workspace/templates";

export type { TemplateKind };

export async function loadTemplate(cwd: string, kind: TemplateKind) {
  const cfg = await loadConfig(cwd);
  return baseLoadTemplate(cwd, kind, { templatesDir: cfg.paths.templates });
}
