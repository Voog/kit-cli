import Kit from 'kit-core';
import path from 'path';
import Promise from 'bluebird';
import {
  name,
  pushFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath
} from '../utils';
import {
  no_project_found
} from '../messages.json';

const pushAllFiles = (project) => {
  let bar = progressStart(Kit.projects.totalFilesFor(project), progressBarFormat);

  Kit.actions.pushAllFiles(project)
    .then(promises => promises[0])
    .mapSeries(progressTick(bar))
    .then(progressEnd(bar));

};

const pushFiles = (project, files) => {
  let bar = progressStart(files.length, progressBarFormat);

  Promise
    .all(files.map(file => Kit.actions.pushFile(project, file)))
    .mapSeries(progressTick(bar))
    .then(progressEnd(bar));
};

const push = (args, flags) => {
  let files = args;
  let currentProject = findProjectByPath(process.cwd());

  if (!currentProject.length > 0) {
    console.log(no_project_found);

  } else {
    let project = currentProject[0];
    if (files.length === 0) {
      pushAllFiles(project);
    } else {
      pushFiles(project, files);
    }
  }
}

export default push
export {
  pushAllFiles,
  pushFiles
}