import Kit from 'kit-core';
import _ from 'lodash';

import {
  name,
  getCurrentSite,
  showNotice
} from '../utils';

export const helpText = `
Sites - lists all sites defined in the current scope

Usage
  $ ${name} sites
`;

const siteRow = (name, options = {}) => {
  const currentProject = getCurrentSite(options);

  const host = Kit.sites.hostFor(name, options);
  let current = '';

  if (!currentProject) {
    current = '';
  } else {
    current = (name === currentProject.name || name == currentProject.host) ? ' [current]' : '';
  }

  return `  ${name} (${host})${current}`;
};

const sites = (args, options = {}) => {
  const names = Kit.sites.names(options);
  showNotice(`Sites:\n${names.map((name) => siteRow(name, options)).join('\n')}\n`);
};

export default sites;
