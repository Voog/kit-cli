import meow from 'meow';
import chalk from 'chalk';

import {name} from './utils';

// COMMANDS
import * as commands from './commands/index';

const cli = meow({
  help: `
${name} is a command-line tool to synchronize Voog layout files.

Usage
  $ ${name} <command> [<args] [--debug]

Commands
  test              Test command
  pull [<files>]    Pull files
  push [<files>]    Push files

  help              Show this message
  help <command>    Show help for a specific command

Options
  --debug           Show debugging output
`,
  description: false
});

let [command, ...args] = cli.input;
let flags = cli.flags;

if (cli.flags.debug) {
  console.log(cli);
  console.log('command:', command);
  console.log('args:', args);
}

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  commands[command](args, flags);
} else {
  cli.showHelp();
}
