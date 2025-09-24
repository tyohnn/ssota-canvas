import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { ensureScaffold } from '../../domain/scaffold.js';

export const registerInitCommand = (program: Command) => {
  program
    .command('init')
    .description('Initialize .ssota/ and .claude/ in the current directory')
    .action(async () => {
      const spinner = ora('Initializing Xbowl project').start();
      try {
        const result = await ensureScaffold(process.cwd());
        spinner.succeed('Initialized Xbowl project structure');
        console.log(
          chalk.green(
            `\nCreated or verified: ${
              result.created.join(', ') || 'nothing (already up to date)'
            }\n`
          )
        );
      } catch (err) {
        spinner.fail('Initialization failed');
        console.error(err);
        process.exitCode = 1;
      }
    });
};
