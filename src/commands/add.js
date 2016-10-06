import Kit from 'kit-core';
import Promise from 'bluebird';
import _ from 'lodash';

import {
  name,
  findProjectByPath,
  showNotice,
  showError,
  fileName
} from '../utils';

import messages from '../messages.json';

const helpText = `
Add - creates a new file and adds it to the site

Usage
  $ ${name} name <filename>
`;

const addFiles = (project, files, options = {}) => {
  Promise.map(
    files,
    file => Kit.actions.addFile((project.name || project.host), file, options)
  ).then(files => {
    return files.reduce((acc, file) => {
      if (file.failed) {
        return {resolved: acc.resolved, rejected: acc.rejected.concat(file)};
      } else {
        return {resolved: acc.resolved.concat(file), rejected: acc.rejected};
      }
    }, {resolved: [], rejected: []})
  }).then(({resolved, rejected}) => {
    if (resolved.length) {
      showNotice(messages.created_files.replace(/%COUNT%/g, resolved.length) + `${resolved.length > 1 ? 's' : ''}:`);
      showNotice(resolved.map(f => `  ${fileName(f)}`).join('\n'));
    }

    if (rejected.length > 0) {
      showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
    }
  });
}

const add = (args, flags) => {
  let files = args;
  let options = _.pick(flags, 'host', 'token', 'site');
  let currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(messages.no_project_found);
  } else if (files.length === 0) {
    console.log(messages.specify_filename);
  } else {
    addFiles(currentProject, files, options);
  }
};

export default add;
export {
  addFiles,
  helpText
};
