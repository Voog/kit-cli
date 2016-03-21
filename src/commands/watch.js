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

let ready = false;
const watcherReady = () => {
  console.log(watcher_ready);
  ready = true;
};

const watcherAdd = (project, path) => {
  if (ready) {
    console.log(`File ${path} has been added`);
  }
};

const watcherChange = (project, path) => {
  console.log(`File ${path} has been changed`);
  pushFiles(project, [path])
};

const watcherRemove = (project, path) => {
  console.log(`File ${path} has been removed`);
};

const watch = (args, flags) => {
  var currentProject = findProjectByPath(process.cwd());
  if (!currentProject.length > 0) {
    console.log(no_project_found);

  } else {
    let project = currentProject[0];
    let dirs = ['assets', 'images', 'javascripts', 'stylesheets', 'layouts', 'components'];
    var watcher = chokidar.watch(dirs, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    watcher
      .on('ready', watcherReady)
      .on('add', _.curry(watcherAdd)(project))
      .on('change', _.curry(watcherChange)(project))
      .on('unlink', _.curry(watcherRemove)(project));
  }
}

export default watch
