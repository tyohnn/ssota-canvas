import { Command } from "commander";
import { loadRegistry } from "../../domain/registry.js";
import { diffExpected } from "../../domain/diff.js";

export const registerDiffCommand = (program: Command) => {
  program
    .command("diff")
    .description("Show differences between expected outputs and filesystem")
    .action(async () => {
      const cwd = process.cwd();
      const reg = await loadRegistry(cwd);
      const entries = await diffExpected(cwd, reg);
      const missing = entries.filter((e) => e.kind === "missing");
      if (missing.length === 0) {
        console.log("No missing files.");
        return;
      }
      console.log("Missing files:");
      for (const m of missing) console.log(`- ${m.path}`);
      process.exitCode = 1;
    });
};
