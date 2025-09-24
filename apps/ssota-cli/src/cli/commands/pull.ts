import { Command } from "commander";
import { pullFromRemote } from "../../domain/sync/pull.js";

export const registerPullCommand = (program: Command) => {
  program
    .command("pull")
    .description("Pull latest registry from remote")
    .action(async () => {
      try {
        const res = await pullFromRemote(process.cwd());
        console.log(`Pull: ${res.status}`);
      } catch (e: any) {
        console.error(`Pull failed: ${e.message || e}`);
        process.exitCode = 1;
      }
    });
};
