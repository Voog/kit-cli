import Kit from 'kit-core';
import path from 'path';
import Promise from 'bluebird';
import {
  name,
  pullFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath
} from '../utils';
import {
  no_project_found
} from '../messages.json';

const pull = (args, flags) => {
  let files = args;
  let currentProject = findProjectByPath(process.cwd());

  if (!currentProject.length > 0) {
    console.log(no_project_found);

  } else {
    let project = currentProject[0];
    if (files.length === 0) {
      let bar = progressStart(Kit.projects.totalFilesFor(project), progressBarFormat);

      Kit.actions.pullAllFiles(project)
        .then(promises => promises[0])
        .mapSeries(progressTick(bar))
        .then(progressEnd(bar));

    } else {
      let bar = progressStart(files.length, progressBarFormat);
      Promise
        .all(files.map(file => Kit.actions.pullFile(project, file)))
        .mapSeries(file => progressTick(bar))
        .then(progressEnd(bar));

    }
  }
}

export default pull
