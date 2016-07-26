import {name} from '../utils';
import _ from 'lodash';

import {unknown_command} from '../messages.json';

import {helpText as pullHelp} from '../commands/pull.js';
import {helpText as pushHelp} from '../commands/push.js';
import {helpText as addHelp} from '../commands/add.js';
import {helpText as removeHelp} from '../commands/remove.js';
import {helpText as sitesHelp} from '../commands/sites.js';
import {helpText as watchHelp} from '../commands/watch.js';

const helpHelp = `
Help - Shows help about a particular command

Usage
  $ ${name} help <command>
`;

const help = (args) => {
  const helpTexts = {
    pull: pullHelp,
    push: pushHelp,
    add: addHelp,
    remove: removeHelp,
    sites: sitesHelp,
    watch: watchHelp,
    help: helpHelp
  };

  let command = args[0];

  if (_.has(helpTexts, command)) {
    console.log(helpTexts(command));
  } else {
    console.log(`
${unknown_command}
    `);
  }
};

export default help;
