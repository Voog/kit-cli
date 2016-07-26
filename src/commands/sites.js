import Kit from 'kit-core';
import _ from 'lodash';

import {
  name,
  getCurrentProject
} from '../utils';

export const helpText = `
Sites - lists all sites defined in the current scope

Usage
  $ ${name} sites
`;

const siteRow = (name, flags) => {
  const currentProject = getCurrentProject(flags);
  const host = Kit.sites.hostFor(name);
  const current = (name === currentProject.name || name == currentProject.host) ? ' [current]' : '';

  return `  ${name} (${host})${current}`;
};

const sites = (args, flags) => {
  const names = Kit.sites.names();
  console.log(`Sites:\n${names.map(_.curryRight(siteRow, flags)).join('\n')}\n`);
};

export default sites;
