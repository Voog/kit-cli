import Kit from 'kit-core';
import Promise from 'bluebird';

import {
  name,
  getCurrentSite,
  showNotice,
  showError,
  fileName,
  handleError
} from '../utils';

import messages from '../messages.json';

const helpText = `
Remove - removes a file, both locally and from the site

Usage
  $ ${name} remove <filename>
`;

const removeFiles = (project, files, options = {}) => {
  Promise.map(
    files,
    file => Kit.actions.removeFile((project.name || project.host), file, Object.assign({}, project, options))
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
      showNotice(messages.removed_files.replace(/%COUNT%/g, resolved.length) + `${resolved.length > 1 ? 's' : ''}:`);
      showNotice(resolved.map(f => `  ${fileName(f)}`).join('\n'));
    }

    if (rejected.length > 0) {
      showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
    }
  }).catch(handleError);
};

const remove = (args, options) => {
  let files = args;
  let currentProject = getCurrentSite(options);

  if (!currentProject) {
    console.log(messages.no_project_found);
  } else if (files.length === 0) {
    console.log(messages.specify_filename);
  } else {
    removeFiles(currentProject, files, options);
  }
};

export default remove;
export {
  removeFiles,
  helpText
};
