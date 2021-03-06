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

const getCurrentSite = (options = {}) => {
  let currentDir = process.cwd();

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
    showError(e.message);
  }
};

/**
 * Returns a new progressbar with the given length and format
 * @param  {Number} total  Length of the progress bar
 * @param  {Object} format Format for the ProgressBar (see pushFormat and pullFormat)
 * @return {Object}        ProgressBar
 */
const progressStart = (total, format) => new ProgressBar(format, progressBarOptions(total + 1));

/**
 * Returns a function that ticks the given progressbar with the given file info
 * @param  {Object} bar   ProgressBar to tick
 * @return {Function}     Object -> Void
 */
const progressTick = bar => file => {
  if (file.failed) {
    bar.total -= 1;
  } else {
    bar.tick({
      file: (file.filename || file.title)
    });
  }
};

/**
 * Final tick for the given progressbar
 * @param  {Object} bar   ProgressBar to tick
 * @return {Function}     Object -> Void
 */
const progressEnd = bar => (count, verb) => {
  let message = `Successfully ${verb} ${count} file${count > 1 ? 's' : ''}`;
  bar.tick({
    file: (typeof count === 'undefined' ? '' : message)
  });
};

const findProjectByPath = (dir, options = {}) => {
  return Kit.sites.byName(_.head(
    Kit.sites.names(options)
      .filter(name => dir.startsWith(Kit.sites.dirFor(name, options)))
    ),
    options
  );
};

const updateConfig = (site = {}, options = {}) => {
  if (_.has(site, 'host') && _.has(site, 'token') && _.indexOf(Kit.sites.hosts, site.host) < 0) {
    if (!Kit.config.configExists(options)) {
      showError('Config not found.');
      Kit.config.create(options);
    }
    showNotice('Creating config and adding site', (site.name ? `${site.name} (${site.host})` : site.host));
    Kit.sites.add(Object.assign({}, site, {path: process.cwd()}), options);
  } else {
    let currentSite = getCurrentSite(options);
    let updates = Object.keys(site).reduce((acc, key) => {
      if (_.includes(['name', 'host', 'token'], key)) { return acc; }

      if (typeof site[key] != 'undefined') { acc[key] = site[key]; }

      return acc;
    }, {});
    if (Object.keys(updates).length > 0) {
      showNotice(`Updating configuration for [${currentSite.name || currentSite.host}]:`, printObject(updates));
      Kit.config.updateSite((currentSite.name || currentSite.host), updates, options);
    }
  }
};

const printObject = (object = {}) => {
  let keys = Object.keys(object);
  if (keys.length > 0) {
    return `{${keys.map(key => `\n  ${key}: ${object[key]}`).join('')}\n}`;
  } else {
    return '{ }';
  }
};

const showError = _.flow(chalk.red, console.log);
const showNotice = _.flow(chalk.white, console.log);

const fileName = (file) => {
  if (_.has(file, 'layout_name')) { // layout or component
    return `${file.component ? 'components' : 'layouts'}/${file.title}`;
  } else { // stylesheet, script file, image or asset
    let folder;
    if (_.includes(['image', 'javascript', 'stylesheet'], file.asset_type)) {
      folder = file.asset_type + 's';
    } else {
      folder = 'assets';
    }
    return `${folder}/${file.filename}`;
  }
};

const handleError = (error) => {
  if (!error || !error.code) {
    showError(error);
  }

  switch (error.code) {
  case 'ECONNREFUSED':
  case 'ECONNRESET':
    showError('Connection failed. Check your host and protocol settings.');
    break;
  default:
    showError(`Something went wrong: ${error.message}`);
  }
};

export {
  name,
  pushFormat,
  pullFormat,
  progressBarOptions,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath,
  getCurrentSite,
  updateConfig,
  showError,
  showNotice,
  fileName,
  handleError,
  printObject
};
