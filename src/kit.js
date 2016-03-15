import meow from 'meow';
import chalk from 'chalk';

import {bin} from '../package.json';
let name = Object.keys(bin)[0];


// COMMANDS
import help from './commands/help';
import test from './commands/test';

const cli = meow({
  help: `
${name} is a command-line tool to synchronize Voog layout files.

Usage
  $ ${name} <command> [<args] [--debug]

Commands
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

switch (command) {
  case 'help':
    if (args.length) {
      help(args[0]);
    } else {
      cli.showHelp();
    }
    break;

  case 'test':
    test(args, flags);
    break;

  default:
    cli.showHelp();
    break;
}
