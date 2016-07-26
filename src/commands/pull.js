import Kit from 'kit-core';
import Promise from 'bluebird';
import chalk from 'chalk';

import {
  name,
  pullFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  getCurrentProject,
  showError,
  showNotice
} from '../utils';

import messages from '../messages.json';
import _ from 'lodash';

export const helpText = `
Pull - pulls files from the Voog site

Usage
  $ ${name} pull [<files>]
`;

const pull = (args, flags) => {
  let files = args;
  let options = _.pick(flags, 'host', 'token', 'site');
  let currentProject = getCurrentProject(flags);
  let bar;

  if (!currentProject) {
    showError(messages.no_project_found);
  } else {
    let project = currentProject;
    showNotice(
      messages.pulling_from,
      project.name ? `${project.name} (${project.host})` : project.host
    );

    if (files.length === 0) {
      Kit.actions
        .getTotalFileCount(project.name || project.host, options)
        .then(total => {
          bar = progressStart(total, progressBarFormat);
          showNotice(`Pulling ${total} files...`);

          Kit.actions
            .pullAllFiles(project.name || project.host, options)
            .then(promises => promises[0])
            .mapSeries(progressTick(bar))
            .then(progressEnd(bar));
        })
        .catch(e => console.log(chalk.red(e)));
    } else {
      bar = progressStart(files.length, progressBarFormat);

      Promise
        .all(files.map(file => Kit.actions.pullFile(project.name || project.host, file, options)))
        .mapSeries(progressTick(bar))
        .then(progressEnd(bar));
    }
  }
};

export default pull;
