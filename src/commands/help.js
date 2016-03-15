import {bin} from '../../package.json';
let name = Object.keys(bin)[0];

import {helpText as testHelp} from './test';

const helpText = `
Help - Shows help about the tool or a particular command

Usage
  $ ${name} help [<args>]
`;

const help = (command) => {
  switch (command) {
    case 'test':
      console.log(testHelp);
      break;
    case 'help':
      console.log(helpText);
      break;
    default:
      console.log(`
Unknown command!
      `);
      break;
  }
};

export default help
