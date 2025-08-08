import { Command } from "commander";
import chalk from "chalk";
import { getStatus } from "../../domain/status.js";
import { loadRegistry } from "../../domain/registry.js";
import { diffExpected } from "../../domain/diff.js";

export const registerStatusCommand = (program: Command) => {
  program
    .command("status")
    .description("Show current Xbowl CLI status in this project")
    .action(async () => {
      const cwd = process.cwd();
      const s = await getStatus(cwd);
      console.log("");
      console.log(chalk.bold("Directories"));
      console.log(
        `- .xbowl:   ${s.hasXbowl ? chalk.green("OK") : chalk.red("missing")}`
      );
      console.log(
        `- .claude:  ${s.hasClaude ? chalk.green("OK") : chalk.red("missing")}`
      );
      console.log("");
      console.log(chalk.bold("Registry"));
      console.log(`- blocks:   ${s.registry.blocks.length}`);
      console.log("");
      console.log(chalk.bold("Generated files"));
      console.log(`- agents:   ${s.generated.agents}`);
      console.log(`- commands: ${s.generated.commands}`);
      console.log(`- data:     ${s.generated.data}`);

      const reg = await loadRegistry(cwd);
      const entries = await diffExpected(cwd, reg);
      const missing = entries.filter((e) => e.kind === "missing");
      if (missing.length > 0) {
        console.log("");
        console.log(chalk.bold("Missing"));
        for (const m of missing) console.log(`- ${m.path}`);
      }
      console.log("");
    });
};
