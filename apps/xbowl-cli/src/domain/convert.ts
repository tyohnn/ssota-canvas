import * as path from "path";
import { writeText } from "./fs.js";
import {
  CLAUDE_AGENTS_DIR,
  CLAUDE_COMMANDS_DIR,
  XBOWL_DATA_DIR,
} from "./constants.js";
import {
  AgentMetadata,
  BlockRegistry,
  ChecklistMetadata,
  DataMetadata,
  TaskMetadata,
  WorkflowMetadata,
} from "./types.js";
import { renderTemplateStrict } from "./templates/engine.js";
import { loadTemplate } from "./templates/loader.js";
import { loadConfig } from "./config.js";

export type WriteAction = { kind: "agent" | "command" | "data"; path: string };

export async function convertAndWriteAll(
  cwd: string,
  registry: BlockRegistry,
  options: { dryRun?: boolean } = {}
): Promise<WriteAction[]> {
  const cfg = await loadConfig(cwd);
  const actions: WriteAction[] = [];

  const requiredPhrases = cfg.templates?.requiredPhrases || [];
  const securityWarnings = cfg.templates?.securityWarnings || [];

  for (const block of registry.blocks) {
    switch (block.block_type) {
      case "agent": {
        const md = block.metadata as AgentMetadata;
        const file = path.join(
          cwd,
          CLAUDE_AGENTS_DIR,
          `${sanitize(md.slug || block.slug)}.md`
        );
        const tpl = await loadTemplate(cwd, "agent");
        const ctx = { ...md, requiredPhrases, securityWarnings };
        const content = renderTemplateStrict(tpl, ctx, [
          "identity",
          "focus",
          "core_principles",
        ]);
        ensureNonEmpty(content, `agent:${md.slug}`);
        if (!options.dryRun) await writeText(file, content);
        actions.push({ kind: "agent", path: file });
        break;
      }
      case "task": {
        const md = block.metadata as TaskMetadata;
        const file = path.join(
          cwd,
          CLAUDE_COMMANDS_DIR,
          `${sanitize(md.slug || block.slug)}.md`
        );
        const tpl = await loadTemplate(cwd, "command");
        const ctx = { ...md, requiredPhrases, securityWarnings };
        const content = renderTemplateStrict(tpl, ctx);
        ensureNonEmpty(content, `task:${md.slug}`);
        if (!options.dryRun) await writeText(file, content);
        actions.push({ kind: "command", path: file });
        break;
      }
      case "checklist": {
        const md = block.metadata as ChecklistMetadata;
        const file = path.join(
          cwd,
          CLAUDE_COMMANDS_DIR,
          `${sanitize(md.slug || block.slug)}.md`
        );
        const tpl = await loadTemplate(cwd, "command");
        const ctx = { ...md, requiredPhrases, securityWarnings };
        const content = renderTemplateStrict(tpl, ctx);
        ensureNonEmpty(content, `checklist:${md.slug}`);
        if (!options.dryRun) await writeText(file, content);
        actions.push({ kind: "command", path: file });
        break;
      }
      case "data": {
        const md = block.metadata as DataMetadata;
        const dataPath = path.join(
          cwd,
          XBOWL_DATA_DIR,
          `${sanitize(md.slug || block.slug)}${inferExt(md)}`
        );
        const cmdPath = path.join(
          cwd,
          CLAUDE_COMMANDS_DIR,
          `load-${sanitize(md.slug || block.slug)}.md`
        );
        if (!options.dryRun) {
          await writeText(dataPath, md.content || "");
          const tpl = await loadTemplate(cwd, "data-load");
          const ctx = {
            ...md,
            ext: inferExt(md),
            requiredPhrases,
            securityWarnings,
          };
          const content = renderTemplateStrict(tpl, ctx);
          ensureNonEmpty(content, `data:${md.slug}`);
          await writeText(cmdPath, content);
        }
        actions.push({ kind: "data", path: dataPath });
        actions.push({ kind: "command", path: cmdPath });
        break;
      }
      case "workflow": {
        const md = block.metadata as WorkflowMetadata;
        const file = path.join(
          cwd,
          CLAUDE_AGENTS_DIR,
          `workflow-${sanitize(md.slug || block.slug)}.md`
        );
        const tpl = await loadTemplate(cwd, "workflow");
        const ctx = { ...md, requiredPhrases, securityWarnings };
        const content = renderTemplateStrict(tpl, ctx);
        ensureNonEmpty(content, `workflow:${md.slug}`);
        if (!options.dryRun) await writeText(file, content);
        actions.push({ kind: "agent", path: file });
        break;
      }
      case "artifact_template":
      case "artifact_class": {
        // Future work
        break;
      }
      default:
        break;
    }
  }
  return actions;
}

function sanitize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\-_.가-힣]/gi, "-");
}

function inferExt(md: DataMetadata): string {
  if (md.file) return path.extname(md.file);
  if (md.filetype) {
    const t = md.filetype.toLowerCase();
    if (t.includes("json")) return ".json";
    if (t.includes("md")) return ".md";
    if (t.includes("csv")) return ".csv";
    if (t.includes("txt")) return ".txt";
  }
  return ".txt";
}

function ensureNonEmpty(content: string, label: string) {
  if (!content || content.trim().length === 0) {
    throw new Error(`Generated content is empty for ${label}`);
  }
}
