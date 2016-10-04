import meow from 'meow';

import {
  name,
  getCurrentProject,
  updateConfig,
  showError
} from './utils';

// COMMANDS
import * as commands from './commands/index';
import _ from 'lodash';

const cli = meow({
  help: `
${name} is a command-line tool to synchronize Voog layout files.

Usage
  $ ${name} <command> [<args] [--debug]

Commands
  pull [<files>]    Pull files
  push [<files>]    Push files
  add [<files>]     Add files
  remove [<files>]  Remove files
  watch             Watch for changes
  sites             List all sites

  help              Show this message
  help <command>    Show help for a specific command

Options
  --debug           Show debugging output
`,
  description: false
});

const printDebugInfo = (command, args, cli) => {
  const printObject = (object = {}) => {
    let keys = Object.keys(object);
    if (keys.length > 0) {
      return `{${keys.map(key => `\n  ${key}: ${object[key]}`).join('')} }`;
    } else {
      return '{}';
    }
  };

  console.log(`-------
command: ${command}
arguments: ${args.join(' ')}
options: ${printObject(cli.flags)}
current project: ${_.flow([getCurrentProject, printObject])(cli.flags)}
-------`);
};

updateConfig({
  host: cli.flags.host,
  token: cli.flags.token,
  name: cli.flags.name
}, {
  config_path: cli.flags.configPath,
  local: true
});

let [command, ...args] = cli.input;
let flags = cli.flags;

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  try {
    commands[command](args, flags);
  } catch (e) {
    showError(e.message);

    if (cli.flags.debug) {
      console.log(e.stack);
    }
  }
} else {
  cli.showHelp();
}

if (cli.flags.debug) {
  printDebugInfo(command, args, cli);
}
