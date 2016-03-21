import {name} from '../utils';

import {unknown_command} from '../messages.json';

import {helpText as testHelp} from '../commands/test.js';

const helpHelp = `
Help - Shows help about the tool or a particular command

Usage
  $ ${name} help [<args>]
`;

const help = (args, flags) => {
  let command = args[0];
  switch (command) {
    case 'test':
      console.log(testHelp);
      break;
    case 'help':
      console.log(helpHelp);
      break;
    default:
      console.log(`
${unknown_command}
      `);
      break;
  }
};

export default help
