import { createHash } from "crypto";

export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function prefixedSha256(content: string): string {
  return `sha256:${sha256(content)}`;
}
