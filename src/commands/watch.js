import chokidar from 'chokidar';
import _ from 'lodash';
import {
  name,
  getCurrentSite,
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

const onAdd = (options, project, path) => {
  if (ready) {
    showNotice(`File ${path} has been added`);
    addFiles(project, [path], Object.assign({}, project, options));
  }
};

const onChange = (options, project, path) => {
  showNotice(`File ${path} has been changed`);
  pushFiles(project, [path], Object.assign({}, project, options));
};

const onRemove = (options, project, path) => {
  showNotice(`File ${path} has been removed`);
  removeFiles(project, [path], Object.assign({}, project, options));
};

const watch = (args, options) => {
  let currentProject = getCurrentSite(options);

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
      .on('add', _.curry(onAdd)(options, project))
      .on('change', _.curry(onChange)(options, project))
      .on('unlink', _.curry(onRemove)(options, project));
  }
};

export default watch;
