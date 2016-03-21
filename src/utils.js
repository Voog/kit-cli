import ProgressBar from 'progress';
import Kit from 'kit-core';

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
    renderThrottle: 100
  };
};

const progressStart = (total, format) => {
  return new ProgressBar(format, progressBarOptions(total + 1));
};

const progressTick = (bar) => {
  return (file) => {
    bar.tick({
      file: (file.filename || file.title)
    });
  }
};

const progressEnd = (bar) => {
  return () => {
    bar.tick({
      file: 'Done!\n'
    });
  }
};

const findProjectByPath = (currentDir) => {
  return Kit.projects.names()
    .filter(name => currentDir.startsWith(Kit.projects.dirFor(name)))
    .filter(name => {
      let sub = currentDir.replace(Kit.projects.dirFor(name), '');
      return sub.length === 0 || sub.startsWith('/');
    });
};

export {
  name,
  pushFormat,
  pullFormat,
  progressBarOptions,
  progressStart,
  progressTick,
  progressEnd,
  findProjectByPath
}