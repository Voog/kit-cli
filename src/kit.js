import meow from 'meow';

import {
  name,
  getCurrentSite,
  updateConfig,
  showError,
  printObject
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

const getOptions = (flags) => {
  return _.pick(flags, 'host', 'token', 'name', 'protocol', 'overwrite', 'debug', 'configPath', 'local', 'global');
};

const printDebugInfo = (command, args, cli) => {
  console.log(`-------
command: ${command}
arguments: ${args.join(' ')}
options: ${printObject(cli.flags)}
current project: ${_.flow([getCurrentSite, printObject])(getOptions(cli.flags))}
-------`);
};

let options = getOptions(cli.flags);

updateConfig({
  host: cli.flags.host,
  token: cli.flags.token,
  protocol: cli.flags.protocol,
  overwrite: cli.flags.overwrite,
  name: cli.flags.name || cli.flags.host
}, options);

let [command, ...args] = cli.input;

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
