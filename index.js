'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var meow = _interopDefault(require('meow'));
var chalk = require('chalk');
var ProgressBar = _interopDefault(require('progress'));
var Kit = _interopDefault(require('kit-core'));
var path = require('path');
var Promise = _interopDefault(require('bluebird'));
var chokidar = _interopDefault(require('chokidar'));
var _ = _interopDefault(require('lodash'));

var babelHelpers = {};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers;

var bin = { "kit2": "index.js" };

var name = Object.keys(bin)[0];

var progressBarFormat = 'Pushing |:bar| :percent :file';
var progressBarFormat$1 = 'Pulling |:bar| :percent :file';

var progressBarOptions = function progressBarOptions(total) {
  return {
    total: total,
    complete: '=',
    incomplete: ' ',
    width: 24,
    renderThrottle: 100
  };
};

var progressStart = function progressStart(total, format) {
  return new ProgressBar(format, progressBarOptions(total + 1));
};

var progressTick = function progressTick(bar) {
  return function (file) {
    bar.tick({
      file: file.filename || file.title
    });
  };
};

var progressEnd = function progressEnd(bar) {
  return function () {
    bar.tick({
      file: 'Done!\n'
    });
  };
};

var findProjectByPath = function findProjectByPath(currentDir) {
  return Kit.projects.names().filter(function (name) {
    return currentDir.startsWith(Kit.projects.dirFor(name));
  }).filter(function (name) {
    var sub = currentDir.replace(Kit.projects.dirFor(name), '');
    return sub.length === 0 || sub.startsWith('/');
  });
};

var unknown_command = "Unknown command!";
var no_project_found = "No project found in current directory!";
var watcher_ready = "Initial scan complete. Ready for changes";

var helpText = '\nTest - Test command please ignore\n\nUsage\n  $ ' + name + ' test [<args>] [--<flags>]\n';

var test = function test(args, flags) {
  console.log('\nI am a test command.\n  ');
};

var helpHelp = '\nHelp - Shows help about the tool or a particular command\n\nUsage\n  $ ' + name + ' help [<args>]\n';

var help = function help(args, flags) {
  var command = args[0];
  switch (command) {
    case 'test':
      console.log(helpText);
      break;
    case 'help':
      console.log(helpHelp);
      break;
    default:
      console.log('\n' + unknown_command + '\n      ');
      break;
  }
};

var pull = function pull(args, flags) {
  var files = args;
  var currentProject = findProjectByPath(process.cwd());

  if (!currentProject.length > 0) {
    console.log(no_project_found);
  } else {
    (function () {
      var project = currentProject[0];
      if (files.length === 0) {
        var bar = progressStart(Kit.projects.totalFilesFor(project), progressBarFormat$1);

        Kit.actions.pullAllFiles(project).then(function (promises) {
          return promises[0];
        }).mapSeries(progressTick(bar)).then(progressEnd(bar));
      } else {
        (function () {
          var bar = progressStart(files.length, progressBarFormat$1);
          Promise.all(files.map(function (file) {
            return Kit.actions.pullFile(project, file);
          })).mapSeries(function (file) {
            return progressTick(bar);
          }).then(progressEnd(bar));
        })();
      }
    })();
  }
};

var pushAllFiles = function pushAllFiles(project) {
  var bar = progressStart(Kit.projects.totalFilesFor(project), progressBarFormat);

  Kit.actions.pushAllFiles(project).then(function (promises) {
    return promises[0];
  }).mapSeries(progressTick(bar)).then(progressEnd(bar));
};

var pushFiles = function pushFiles(project, files) {
  var bar = progressStart(files.length, progressBarFormat);

  Promise.all(files.map(function (file) {
    return Kit.actions.pushFile(project, file);
  })).mapSeries(progressTick(bar)).then(progressEnd(bar));
};

var push = function push(args, flags) {
  var files = args;
  var currentProject = findProjectByPath(process.cwd());

  if (!currentProject.length > 0) {
    console.log(no_project_found);
  } else {
    var project = currentProject[0];
    if (files.length === 0) {
      pushAllFiles(project);
    } else {
      pushFiles(project, files);
    }
  }
};

var ready = false;
var watcherReady = function watcherReady() {
  console.log(watcher_ready);
  ready = true;
};

var watcherAdd = function watcherAdd(project, path) {
  if (ready) {
    console.log('File ' + path + ' has been added');
  }
};

var watcherChange = function watcherChange(project, path) {
  console.log('File ' + path + ' has been changed');
  pushFiles(project, [path]);
};

var watcherRemove = function watcherRemove(project, path) {
  console.log('File ' + path + ' has been removed');
};

var watch = function watch(args, flags) {
  var currentProject = findProjectByPath(process.cwd());
  if (!currentProject.length > 0) {
    console.log(no_project_found);
  } else {
    var project = currentProject[0];
    var dirs = ['assets', 'images', 'javascripts', 'stylesheets', 'layouts', 'components'];
    var watcher = chokidar.watch(dirs, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    watcher.on('ready', watcherReady).on('add', _.curry(watcherAdd)(project)).on('change', _.curry(watcherChange)(project)).on('unlink', _.curry(watcherRemove)(project));
  }
};



var commands = Object.freeze({
	help: help,
	test: test,
	pull: pull,
	push: push,
	watch: watch
});

var cli = meow({
  help: '\n' + name + ' is a command-line tool to synchronize Voog layout files.\n\nUsage\n  $ ' + name + ' <command> [<args] [--debug]\n\nCommands\n  test              Test command\n  pull [<files>]    Pull files\n  push [<files>]    Push files\n\n  help              Show this message\n  help <command>    Show help for a specific command\n\nOptions\n  --debug           Show debugging output\n',
  description: false
});

var _cli$input = babelHelpers.toArray(cli.input);

var command = _cli$input[0];

var args = _cli$input.slice(1);

var flags = cli.flags;

if (cli.flags.debug) {
  console.log(cli);
  console.log('command:', command);
  console.log('args:', args);
}

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  commands[command](args, flags);
} else {
  cli.showHelp();
}