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
  watch             Watch for changes
  add [<files>]     Add files
  remove [<files>]  Remove files
  sites             List all sites

  help <command>    Show help for a specific command

Options
  --host            Site's hostname
  --token           Your personal API token
  --protocol        Explicit protocol (http/https)
  --overwrite       Enable overwriting layout assets on save (images, icons etc.)
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
  protocol: cli.flags.protocol || 'http',
  overwrite: cli.flags.overwrite || false,
  name: cli.flags.name || cli.flags.host
}, {
  config_path: cli.flags.configPath,
  local: true
});

let [command, ...args] = cli.input;
let options = _.pick(cli.flags, 'host', 'token', 'name', 'protocol', 'overwrite', 'debug');

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  try {
    commands[command](args, options);
  } catch (e) {
    showError(e.message);

    if (options.debug) {
      console.log(e.stack);
    }
  }
} else {
  cli.showHelp();
}

if (options.debug) {
  printDebugInfo(command, args, cli);
}
