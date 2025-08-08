import { BlockRegistry } from "./types.js";
import { isValidSlug } from "./utils/slug.js";

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
  blockId?: string;
  field?: string;
}

export function validateRegistry(reg: BlockRegistry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();

  for (const b of reg.blocks || []) {
    if (!isValidSlug(b.slug)) {
      issues.push({
        level: "error",
        message: `Invalid slug: ${b.slug}`,
        blockId: b.id,
        field: "slug",
      });
    }
    if (seenSlugs.has(b.slug)) {
      issues.push({
        level: "error",
        message: `Duplicate slug: ${b.slug}`,
        blockId: b.id,
        field: "slug",
      });
    } else {
      seenSlugs.add(b.slug);
    }

    if (b.id) {
      if (seenIds.has(b.id)) {
        issues.push({
          level: "error",
          message: `Duplicate id: ${b.id}`,
          blockId: b.id,
          field: "id",
        });
      } else {
        seenIds.add(b.id);
      }
    }

    switch (b.block_type) {
      case "agent": {
        const m: any = b.metadata || {};
        for (const f of ["name", "slug", "role"]) {
          if (!m[f])
            issues.push({
              level: "error",
              message: `Agent missing ${f}`,
              blockId: b.id,
              field: f,
            });
        }
        break;
      }
      case "task": {
        const m: any = b.metadata || {};
        for (const f of ["name", "slug", "instructions"]) {
          if (!m[f])
            issues.push({
              level: "error",
              message: `Task missing ${f}`,
              blockId: b.id,
              field: f,
            });
        }
        break;
      }
      case "workflow": {
        const m: any = b.metadata || {};
        for (const f of ["name", "slug"]) {
          if (!m[f])
            issues.push({
              level: "error",
              message: `Workflow missing ${f}`,
              blockId: b.id,
              field: f,
            });
        }
        break;
      }
      case "data": {
        const m: any = b.metadata || {};
        for (const f of ["name", "slug", "content"]) {
          if (!m[f])
            issues.push({
              level: "error",
              message: `Data missing ${f}`,
              blockId: b.id,
              field: f,
            });
        }
        break;
      }
      case "checklist": {
        const m: any = b.metadata || {};
        for (const f of ["name", "slug", "instructions"]) {
          if (!m[f])
            issues.push({
              level: "error",
              message: `Checklist missing ${f}`,
              blockId: b.id,
              field: f,
            });
        }
        break;
      }
      default:
        break;
    }
  }

  // Referential integrity for edges
  const idSet = new Set(
    (reg.blocks || []).map((b) => b.id).filter(Boolean) as string[]
  );
  for (const e of reg.edges || []) {
    if (!e.source_block_id || !idSet.has(e.source_block_id)) {
      issues.push({
        level: "error",
        message: `Edge source not found: ${e.source_block_id}`,
        field: "source_block_id",
      });
    }
    if (!e.target_block_id || !idSet.has(e.target_block_id)) {
      issues.push({
        level: "error",
        message: `Edge target not found: ${e.target_block_id}`,
        field: "target_block_id",
      });
    }
  }

  return issues;
}
