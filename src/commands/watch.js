import Kit from 'kit-core';
import path from 'path';
import Promise from 'bluebird';
import chokidar from 'chokidar';
import _ from 'lodash';
import {
  name,
  findProjectByPath,
  showError,
  showNotice
} from '../utils';

import {pushFiles} from './push';
import {addFiles} from './add';
import {removeFiles} from './remove';

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
  showNotice(watcher_ready);
  ready = true;
};

const onAdd = (project, path) => {
  if (ready) {
    showNotice(`File ${path} has been added`);
    addFiles(project, [path]);
  }
};

const onChange = (project, path) => {
  showNotice(`File ${path} has been changed`);
  pushFiles(project, [path]);
};

const onRemove = (project, path) => {
  showNotice(`File ${path} has been removed`);
  removeFiles(project, [path]);
};

const watch = (args, flags) => {
  let options = _.pick(flags, 'host', 'token', 'site');
  let currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    showError(no_project_found);
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
