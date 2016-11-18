import Kit from 'kit-core';
import Promise from 'bluebird';
import _ from 'lodash';

import {
  name,
  pullFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  getCurrentSite,
  showNotice,
  showError,
  fileName,
  handleError
} from '../utils';

import messages from '../messages.json';

export const helpText = `
Pull - pulls files from the Voog site

Usage
  $ ${name} pull [<files>]

  Using pull without arguments pulls all layout files from your site.
`;

const pullAllFiles = (project, options) => {
  let projectName = project.name || project.host;
  // setting progress bar length to 0 at first because we don't know how many files there are before pulling
  let bar = progressStart(0, progressBarFormat);

  return Kit.actions.pullAllFiles(projectName, Object.assign({}, project, options))
    .then(promises => {
      let files = _.head(promises);
      bar.total = files.length + 1; // set progress bar length based on number of files found
      return files;
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
      if (resolved.length > 0) {
        // show final message on the progress bar
        progressEnd(bar)(resolved.length, 'pulled');
      }

      if (rejected.length > 0) {
        // show invalid files
        showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
      }
    }).catch(handleError);
};

const pullFiles = (project, files, options) => {
  // initialize progress bar with length of files given as arguments
  let bar = progressStart(0, progressBarFormat);
  let projectName = project.name || project.host;

  Promise
    .all(files.map(file => {
      if (_.includes(['layouts', 'components', 'images', 'assets', 'stylesheets', 'javascripts'], file)) {
        return Kit.actions.pullFolder(projectName, file, Object.assign({}, project, options));
      } else {
        return Kit.actions.pullFile(projectName, file, Object.assign({}, project, options));
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
        showNotice(`Successfully pulled ${resolved.length} file${resolved.length > 1 ? 's' : ''}:`);
        showNotice(resolved.map(f => `  ${fileName(f)}`).join('\n'));
      }

      if (rejected.length > 0) {
        // show invalid files
        showError(`There were some errors:\n${rejected.map(f => `  ${f.file} (${f.message})`).join('\n')}`);
      }
    }).catch(handleError);
};

const pull = (args, options) => {
  let files = args;
  let currentProject = getCurrentSite(options);

  if (!currentProject) {
    showNotice(messages.no_project_found);
  } else {
    let project = currentProject;
    let projectName = project.name ? `${project.name} (${project.host})` : project.host;

    showNotice(messages.pulling_from, projectName);

    if (files.length === 0) {
      pullAllFiles(project, options);
    } else {
      pullFiles(project, files, options);
    }
  }
};

export default pull;
export {
  pullAllFiles,
  pullFiles
};
