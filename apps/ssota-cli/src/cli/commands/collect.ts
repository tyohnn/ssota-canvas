import { Command } from 'commander';
import { collectArtifacts } from '../../domain/sync/collect.js';

export const registerCollectCommand = (program: Command) => {
  program
    .command('collect')
    .description('Scan .ssota/artifacts and summarize (DB push TBD)')
    .action(async () => {
      const res = await collectArtifacts(process.cwd());
      console.log(`Artifacts: ${res.total}`);
      for (const [k, v] of Object.entries(res.byClass)) {
        console.log(`- ${k}: ${v}`);
      }
    });
};
