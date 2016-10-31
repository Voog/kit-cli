import Kit from 'kit-core';
import Promise from 'bluebird';

import {
  name,
  getCurrentProject,
  showNotice,
  showError,
  fileName,
  handleError
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
    }, {resolved: [], rejected: []});
  }).then(({resolved, rejected}) => {
    if (resolved.length) {
      showNotice(messages.created_files.replace(/%COUNT%/g, resolved.length) + `${resolved.length > 1 ? 's' : ''}:`);
      showNotice(resolved.map(f => `  ${fileName(f)}`).join('\n'));
    }

    if (rejected.length > 0) {
      showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
    }
  }).catch(handleError);
};

const add = (args, options) => {
  let files = args;
  let currentProject = getCurrentProject(options);

  if (!currentProject) {
    showError(messages.no_project_found);
  } else if (files.length === 0) {
    showError(messages.specify_filename);
  } else {
    addFiles(currentProject, files, options);
  }
};

export default add;
export {
  addFiles,
  helpText
};
