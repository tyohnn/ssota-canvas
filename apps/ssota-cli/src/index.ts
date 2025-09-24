import { Command } from 'commander';
import { registerInitCommand } from './cli/commands/init.js';
import { registerSyncCommand } from './cli/commands/sync.js';
import { registerStatusCommand } from './cli/commands/status.js';
import { registerPullCommand } from './cli/commands/pull.js';
import { registerDiffCommand } from './cli/commands/diff.js';
import { registerValidateCommand } from './cli/commands/validate.js';
import { registerDoctorCommand } from './cli/commands/doctor.js';
import { registerCollectCommand } from './cli/commands/collect.js';

const program = new Command();

program
  .name('ssota')
  .description(
    'Xbowl CLI - Convert Xbowl workflow blocks to Claude Code sub-agents and slash commands'
  )
  .version('0.1.0');

registerInitCommand(program);
registerSyncCommand(program);
registerStatusCommand(program);
registerPullCommand(program);
registerDiffCommand(program);
registerValidateCommand(program);
registerDoctorCommand(program);
registerCollectCommand(program);

program.parseAsync(process.argv);
