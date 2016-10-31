import Kit from 'kit-core';
import Promise from 'bluebird';
import _ from 'lodash';

import {
  name,
  pushFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  getCurrentProject,
  showNotice,
  showError,
  fileName,
  handleError
} from '../utils';

import messages from '../messages.json';

export const helpText = `
Push - pushes files to the Voog site

Usage
  $ ${name} push [<files>]

  Using push without arguments pushes all layout files to your site
`;

const pushAllFiles = (project, options) => {
  let projectName = project.name || project.host;
  // initialize progress bar with number of local files
  let bar = progressStart(Kit.sites.totalFilesFor(projectName, options), progressBarFormat);

  return Kit.actions.pushAllFiles(projectName, options)
    .then(promises => _.head(promises))
    .each(progressTick(bar)) // bump progress bar as each promise resolves
    .then(files => {
      // separate invalid files from resolved files
      return files.reduce(
        (acc, file) => {
          if (!file.failed) {
            return Object.assign({}, {rejected: acc.rejected, resolved: acc.resolved.concat(file)});
          } else {
            return Object.assign({}, {rejected: acc.rejected.concat(file), resolved: acc.resolved});
          }
        },
        {rejected: [], resolved: []}
      );
    })
    .then(({rejected, resolved}) => {
      if (resolved.length > 0) {
        // show final message on the progress bar
        progressEnd(bar)(resolved.length, 'pushed');
      }

      if (rejected.length > 0) {
        // show invalid files
        showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
      }
    }).catch(handleError);
};

const pushFiles = (project, files, options) => {
  // initialize progress bar with length of files given as arguments
  let bar = progressStart(0, progressBarFormat);
  let projectName = project.name || project.host;

  Promise
    .all(files.map(file => {
      if (_.includes(['layouts', 'components', 'images', 'assets', 'stylesheets', 'javascripts'], file)) {
        return Kit.actions.pushFolder(projectName, file, options);
      } else {
        return Kit.actions.pushFile(projectName, file, options);
      }
    }))
    .then(files => {
      bar.total = _.flatten(files).length + 1;
      return _.flatten(files);
    })
    .each(progressTick(bar)) // bump the progress bar as each promise resolves
    .then(files => {
      // separate invalid files from resolved files
      return files.reduce(
        (acc, file) => {
          if (!file.failed) {
            return Object.assign({}, {rejected: acc.rejected, resolved: acc.resolved.concat(file)});
          } else {
            return Object.assign({}, {rejected: acc.rejected.concat(file), resolved: acc.resolved});
          }
        },
        {rejected: [], resolved: []}
      );
    })
    .then(({rejected, resolved}) => {
      progressEnd(bar)(); // Clear last filename from progress bar

      if (resolved.length > 0) {
        // show final message on the progress bar
        showNotice(`Successfully pushed ${resolved.length} file${resolved.length > 1 ? 's' : ''}:`);
        showNotice(resolved.map(f => `  ${fileName(f)}`).join('\n'));
      }

      if (rejected.length > 0) {
        // show invalid files
        showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
      }
    }).catch(handleError);
};

const push = (args, options) => {
  let files = args;
  let currentProject = getCurrentProject(options);

  if (!currentProject) {
    showNotice(messages.no_project_found);
  } else {
    let project = currentProject;
    let projectName = project.name ? `${project.name} (${project.host})` : project.host;

    showNotice(messages.pushing_to, projectName);

    if (files.length === 0) {
      pushAllFiles(project, options);
    } else {
      pushFiles(project, files, options);
    }
  }
};

export default push;
export {
  pushAllFiles,
  pushFiles
};
