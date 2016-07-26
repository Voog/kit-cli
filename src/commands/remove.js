import Kit from 'kit-core';
import Promise from 'bluebird';
import _ from 'lodash';

import {
  name,
  findProjectByPath
} from '../utils';
import {
  no_project_found,
  specify_filename
} from '../messages.json';

export const helpText = `
Remove - removes a file, both locally and from the site

Usage
  $ ${name} remove <filename>
`;

const remove = (args, flags) => {
  let files = args;
  let options = _.pick(flags, 'host', 'token', 'site');
  let currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(no_project_found);
  } else if (files.length === 0) {
    console.log(specify_filename);
  } else {
    let project = currentProject;

    Promise.map(files, file => Kit.actions.removeFile((project.name || project.host), file, options)).then(console.log);
  }
};

export default remove;
