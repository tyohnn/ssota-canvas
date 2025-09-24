import { Command } from "commander";
import { loadRegistry } from "../../domain/registry.js";
import { validateRegistry } from "../../domain/validate.js";

export const registerValidateCommand = (program: Command) => {
  program
    .command("validate")
    .description("Validate block-registry and generated files")
    .action(async () => {
      const cwd = process.cwd();
      const reg = await loadRegistry(cwd);
      const issues = validateRegistry(reg);
      const errors = issues.filter((i) => i.level === "error");
      const warnings = issues.filter((i) => i.level === "warning");

      if (warnings.length) {
        console.log("Warnings:");
        for (const w of warnings) console.log(`- ${w.message}`);
        console.log("");
      }
      if (errors.length) {
        console.error("Errors:");
        for (const e of errors) console.error(`- ${e.message}`);
        process.exitCode = 1;
        return;
      }
      console.log("Validation passed.");
    });
};
