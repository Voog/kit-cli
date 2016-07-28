#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var meow = _interopDefault(require('meow'));
var ProgressBar = _interopDefault(require('progress'));
var Kit = _interopDefault(require('kit-core'));
var _ = _interopDefault(require('lodash'));
var chalk = _interopDefault(require('chalk'));
var Promise = _interopDefault(require('bluebird'));
var path = require('path');
var chokidar = _interopDefault(require('chokidar'));

var babelHelpers = {};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers;

var bin = { "kit2": "./index.js" };

var name = Object.keys(bin)[0];

var progressBarFormat = 'Pushing |:bar| :percent :file';
var progressBarFormat$1 = 'Pulling |:bar| :percent :file';

var progressBarOptions = function progressBarOptions(total) {
  return {
    total: total,
    complete: '=',
    incomplete: ' ',
    width: 24,
    renderThrottle: 1
  };
};

var getCurrentProject = function getCurrentProject(flags) {
  var currentDir = process.cwd();
  var options = _.pick(flags, 'configPath', 'global', 'local', 'host', 'token', 'site', 'name');

  try {
    // prefer explicit options
    if (_.has(options, 'site') || _.has(options, 'name') || _.has(options, 'host') && !_.has(options, 'token')) {
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
      file: 'Done!'
    });
  };
};

var findProjectByPath = function findProjectByPath(dir, options) {
  return Kit.sites.byName(_.head(Kit.sites.names(options).filter(function (name) {
    return dir.startsWith(Kit.sites.dirFor(name, options));
  })));
};

var updateConfig = function updateConfig(site) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (_.has(site, 'host') && _.has(site, 'token') && _.indexOf(Kit.sites.hosts, site.host) < 0) {
    if (!Kit.config.exists(options)) {
      console.log('config doesn\'t exist');
      Kit.config.create(options);
    }
    console.log('adding site', site);
    Kit.sites.add(Object.assign({}, site, { path: process.cwd() }), options);
  }
};

var showError = _.flow(chalk.red, console.log);
var showNotice = _.flow(chalk.white, console.log);

var unknown_command = "Unknown command!";
var no_project_found = "No project found in current directory!";
var pulling_from = "Pulling files from";
var watcher_ready = "Initial scan complete. Ready for changes";
var specify_filename = "Please specify filename!";
var messages = {
	unknown_command: unknown_command,
	no_project_found: no_project_found,
	pulling_from: pulling_from,
	watcher_ready: watcher_ready,
	specify_filename: specify_filename
};

var helpText = '\nPull - pulls files from the Voog site\n\nUsage\n  $ ' + name + ' pull [<files>]\n';

var pull = function pull(args, flags) {
  var files = args;
  var options = _.pick(flags, 'host', 'token', 'site');
  var currentProject = getCurrentProject(flags);
  var bar = void 0;

  if (!currentProject) {
    showError(messages.no_project_found);
  } else {
    (function () {
      var project = currentProject;
      showNotice(messages.pulling_from, project.name ? project.name + ' (' + project.host + ')' : project.host);

      if (files.length === 0) {
        Kit.actions.getTotalFileCount(project.name || project.host, options).then(function (total) {
          bar = progressStart(total, progressBarFormat$1);
          showNotice('Pulling ' + total + ' files...');

          Kit.actions.pullAllFiles(project.name || project.host, options).then(function (promises) {
            return promises[0];
          }).mapSeries(progressTick(bar)).then(progressEnd(bar));
        }).catch(function (e) {
          return console.log(chalk.red(e));
        });
      } else {
        bar = progressStart(files.length, progressBarFormat$1);

        Promise.all(files.map(function (file) {
          return Kit.actions.pullFile(project.name || project.host, file, options);
        })).mapSeries(progressTick(bar)).then(progressEnd(bar));
      }
    })();
  }
};

var helpText$1 = '\nPush - pushes files to the Voog site\n\nUsage\n  $ ' + name + ' push [<files>]\n';

var pushAllFiles = function pushAllFiles(project) {
  var bar = progressStart(Kit.sites.totalFilesFor(project), progressBarFormat);
  var projectName = project.name || project.host;

  Kit.actions.pushAllFiles(projectName).then(function (promises) {
    return promises[0];
  }).mapSeries(progressTick(bar)).then(progressEnd(bar));
};

var pushFiles = function pushFiles(project, files) {
  var bar = progressStart(files.length, progressBarFormat);
  var projectName = project.name || project.host;

  Promise.all(files.map(function (file) {
    return Kit.actions.pushFile(projectName, file);
  })).mapSeries(progressTick(bar)).then(progressEnd(bar));
};

var push = function push(args, flags) {
  var files = args;
  var options = _.pick(flags, 'host', 'token', 'site');
  var currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(no_project_found);
  } else {
    var project = currentProject;
    if (files.length === 0) {
      pushAllFiles(project);
    } else {
      pushFiles(project, files);
    }
  }
};

var helpText$2 = '\nAdd - creates a new file and adds it to the site\n\nUsage\n  $ ' + name + ' name <filename>\n';

var add = function add(args, flags) {
  var files = args;
  var options = _.pick(flags, 'host', 'token', 'site');
  var currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(no_project_found);
  } else if (files.length === 0) {
    console.log(specify_filename);
  } else {
    (function () {
      var project = currentProject;

      Promise.map(files, function (file) {
        return Kit.actions.addFile(project.name || project.host, file, options);
      }).then(console.log);
    })();
  }
};

var helpText$3 = '\nRemove - removes a file, both locally and from the site\n\nUsage\n  $ ' + name + ' remove <filename>\n';

var remove = function remove(args, flags) {
  var files = args;
  var options = _.pick(flags, 'host', 'token', 'site');
  var currentProject = findProjectByPath(process.cwd(), options);

  if (!currentProject) {
    console.log(no_project_found);
  } else if (files.length === 0) {
    console.log(specify_filename);
  } else {
    (function () {
      var project = currentProject;

      Promise.map(files, function (file) {
        return Kit.actions.removeFile(project.name || project.host, file, options);
      }).then(console.log);
    })();
  }
};

var helpText$4 = '\nSites - lists all sites defined in the current scope\n\nUsage\n  $ ' + name + ' sites\n';

var siteRow = function siteRow(name, flags) {
  var currentProject = getCurrentProject(flags);

  var host = Kit.sites.hostFor(name);
  var current = '';

  if (!currentProject) {
    current = '';
  } else {
    current = name === currentProject.name || name == currentProject.host ? ' [current]' : '';
  }

  return '  ' + name + ' (' + host + ')' + current;
};

var sites = function sites(args, flags) {
  var names = Kit.sites.names();
  console.log('Sites:\n' + names.map(_.curryRight(siteRow, flags)).join('\n') + '\n');
};

var helpText$5 = '\nWatch - watches the current folder and adds/updates/removes files on the site\n\nUsage\n  $ ' + name + ' watch\n';

var ready = false;
var onReady = function onReady() {
  console.log(watcher_ready);
  ready = true;
};

var onAdd = function onAdd(project, path) {
  if (ready) {
    console.log('File ' + path + ' has been added');
  }
};

var onChange = function onChange(project, path) {
  console.log('File ' + path + ' has been changed');
  pushFiles(project, [path]);
};

var onRemove = function onRemove(project, path) {
  console.log('File ' + path + ' has been removed');
};

var watch = function watch(args, flags) {
  var currentProject = findProjectByPath(process.cwd());
  if (!currentProject.length > 0) {
    console.log(no_project_found);
  } else {
    var project = currentProject;
    var dirs = ['assets', 'images', 'javascripts', 'stylesheets', 'layouts', 'components'];
    var watcher = chokidar.watch(dirs, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    watcher.on('ready', onReady).on('add', _.curry(onAdd)(project)).on('change', _.curry(onChange)(project)).on('unlink', _.curry(onRemove)(project));
  }
};

var helpHelp = '\nHelp - Shows help about a particular command\n\nUsage\n  $ ' + name + ' help <command>\n';

var help = function help(args) {
  var helpTexts = {
    pull: helpText,
    push: helpText$1,
    add: helpText$2,
    remove: helpText$3,
    sites: helpText$4,
    watch: helpText$5,
    help: helpHelp
  };

  var command = args[0];

  if (_.has(helpTexts, command)) {
    console.log(helpTexts(command));
  } else {
    console.log('\n' + unknown_command + '\n    ');
  }
};



var commands = Object.freeze({
	help: help,
	pull: pull,
	push: push,
	sites: sites,
	watch: watch,
	add: add,
	remove: remove
});

var cli = meow({
  help: '\n' + name + ' is a command-line tool to synchronize Voog layout files.\n\nUsage\n  $ ' + name + ' <command> [<args] [--debug]\n\nCommands\n  pull [<files>]    Pull files\n  push [<files>]    Push files\n  add [<files>]     Add files\n  remove [<files>]  Remove files\n  watch             Watch for changes\n  sites             List all sites\n\n  help              Show this message\n  help <command>    Show help for a specific command\n\nOptions\n  --debug           Show debugging output\n',
  description: false
});

var printDebugInfo = function printDebugInfo(command, args, cli) {
  var printObject = function printObject() {
    var object = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var keys = Object.keys(object);
    if (keys.length > 0) {
      return '{' + keys.map(function (key) {
        return '\n  ' + key + ': ' + object[key];
      }).join('') + ' }';
    } else {
      return '{}';
    }
  };

  console.log('-------\ncommand: ' + command + '\narguments: ' + args.join(' ') + '\noptions: ' + printObject(cli.flags) + '\ncurrent project: ' + _.flow([getCurrentProject, printObject])(cli.flags) + '\n-------');
};

updateConfig({ host: cli.flags.host, token: cli.flags.token }, { config_path: cli.flags.configPath, local: true });

var _cli$input = babelHelpers.toArray(cli.input);

var command = _cli$input[0];

var args = _cli$input.slice(1);

var flags = cli.flags;

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  commands[command](args, flags);
} else {
  cli.showHelp();
}

if (cli.flags.debug) {
  printDebugInfo(command, args, cli);
}