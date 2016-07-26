import ProgressBar from 'progress';
import Kit from 'kit-core';
import _ from 'lodash';
import chalk from 'chalk';

import {bin} from '../package.json';
const name = Object.keys(bin)[0];

const pushFormat = 'Pushing |:bar| :percent :file';
const pullFormat = 'Pulling |:bar| :percent :file';

const progressBarOptions = (total) => {
  return {
    total,
    complete: '=',
    incomplete: ' ',
    width: 24,
    renderThrottle: 1
  };
};

const getCurrentProject = (flags) => {
  let currentDir = process.cwd();
  let options = _.pick(flags, 'configPath', 'global', 'local', 'host', 'token', 'site', 'name');

  try {
    // prefer explicit options
    if ((_.has(options, 'site') || _.has(options, 'name')) || (_.has(options, 'host') && !_.has(options, 'token'))) {
      return Kit.sites.byName(options.site || options.name || options.host);
    } else if (_.has(options, 'host') && _.has(options, 'token')) {
      return _.pick(options, 'host', 'token');
    // otherwise use Kit's own config logic
    } else {
      return findProjectByPath(currentDir, options);
    }
  } catch (e) {
    console.log(chalk.red(e.message));
  }
};

const progressStart = (total, format) => {
  return new ProgressBar(format, progressBarOptions(total + 1));
};

const progressTick = (bar) => {
  return (file) => {
    bar.tick({
      file: (file.filename || file.title)
    });
  };
};

const progressEnd = (bar) => {
  return () => {
    bar.tick({
      file: 'Done!'
    });
  };
};

const findProjectByPath = (dir, options) => {
  return Kit.sites.byName(_.head(Kit.sites.names(options).filter(name => {
    return dir.startsWith(Kit.sites.dirFor(name, options));
  })));
};

const updateConfig = (site, options = {}) => {
  if (_.has(site, 'host') && _.has(site, 'token') && _.indexOf(Kit.sites.hosts, site.host) < 0) {
    if (!Kit.config.exists(options)) {
      console.log('config doesn\'t exist');
      Kit.config.create(options);
    }
    console.log('adding site', site);
    Kit.sites.add(Object.assign({}, site, {path: process.cwd()}), options);
  }
};

const showError = _.flow(chalk.red, console.log);
const showNotice = _.flow(chalk.white, console.log);

export {
  name,
  pushFormat,
  pullFormat,
  progressBarOptions,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath,
  getCurrentProject,
  updateConfig,
  showError,
  showNotice
};
