import Kit from 'kit-core';
import Promise from 'bluebird';
import _ from 'lodash';

import {
  name,
  pushFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath
} from '../utils';

import {no_project_found} from '../messages.json';

export const helpText = `
Push - pushes files to the Voog site

Usage
  $ ${name} push [<files>]
`;

const pushAllFiles = (project) => {
  let bar = progressStart(Kit.sites.totalFilesFor(project), progressBarFormat);
  let projectName = project.name || project.host;

  Kit.actions.pushAllFiles(projectName)
    .then(promises => promises[0])
    .mapSeries(progressTick(bar))
    .then(progressEnd(bar));

};

const pushFiles = (project, files) => {
  let bar = progressStart(files.length, progressBarFormat);
  let projectName = project.name || project.host;

  Promise
    .all(files.map(file => Kit.actions.pushFile(projectName, file)))
    .mapSeries(progressTick(bar))
    .then(progressEnd(bar));
};

const push = (args, flags) => {
  let files = args;
  let options = _.pick(flags, 'host', 'token', 'site');
  let currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(no_project_found);
  } else {
    let project = currentProject;
    if (files.length === 0) {
      pushAllFiles(project);
    } else {
      pushFiles(project, files);
    }
  }
};

export default push;
export {
  pushAllFiles,
  pushFiles
};
