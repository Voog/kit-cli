import Kit from 'kit-core';
import path from 'path';
import Promise from 'bluebird';
import chokidar from 'chokidar';
import _ from 'lodash';
import {
  name,
  pullFormat as progressBarFormat,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath
} from '../utils';

import {pushFiles} from './push';

import {
  no_project_found,
  watcher_ready
} from '../messages.json';

export const helpText = `
Watch - watches the current folder and adds/updates/removes files on the site

Usage
  $ ${name} watch
`;


let ready = false;
const onReady = () => {
  console.log(watcher_ready);
  ready = true;
};

const onAdd = (project, path) => {
  if (ready) {
    console.log(`File ${path} has been added`);
  }
};

const onChange = (project, path) => {
  console.log(`File ${path} has been changed`);
  pushFiles(project, [path])
};

const onRemove = (project, path) => {
  console.log(`File ${path} has been removed`);
};

const watch = (args, flags) => {
  var currentProject = findProjectByPath(process.cwd());
  if (!currentProject.length > 0) {
    console.log(no_project_found);

  } else {
    let project = currentProject;
    let dirs = ['assets', 'images', 'javascripts', 'stylesheets', 'layouts', 'components'];
    var watcher = chokidar.watch(dirs, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    watcher
      .on('ready', onReady)
      .on('add', _.curry(onAdd)(project))
      .on('change', _.curry(onChange)(project))
      .on('unlink', _.curry(onRemove)(project));
  }
}

export default watch
