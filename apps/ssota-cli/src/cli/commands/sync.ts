import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadRegistry } from '../../domain/registry.js';
import { convertAndWriteAll } from '../../domain/convert.js';

export const registerSyncCommand = (program: Command) => {
  program
    .command('sync')
    .description(
      'Scan .ssota/block-registry.json and generate Claude-compatible files'
    )
    .option('--dry-run', 'Do not write files, only print actions', false)
    .action(async (opts: { dryRun?: boolean }) => {
      const cwd = process.cwd();
      const spinner = ora('Scanning registry').start();
      try {
        const registry = await loadRegistry(cwd);
        spinner.text = 'Converting blocks';
        const actions = await convertAndWriteAll(cwd, registry, {
          dryRun: Boolean(opts.dryRun),
        });
        spinner.succeed('Sync complete');
        console.log(chalk.cyan(`\nArtifacts:`));
        for (const a of actions) {
          console.log(`- ${a.kind}: ${a.path}`);
        }
        console.log('');
      } catch (err) {
        spinner.fail('Sync failed');
        console.error(err);
        process.exitCode = 1;
      }
    });
};
