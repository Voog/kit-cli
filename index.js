#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var meow = _interopDefault(require('meow'));
var ProgressBar = _interopDefault(require('progress'));
var Kit = _interopDefault(require('kit-core'));
var _ = _interopDefault(require('lodash'));
var chalk = _interopDefault(require('chalk'));
var Promise = _interopDefault(require('bluebird'));
var chokidar = _interopDefault(require('chokidar'));

var babelHelpers = {};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers;

var bin = { "voog": "./index.js", "kit": "./index.js" };

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
    showError(e.message);
  }
};

/**
 * Returns a new progressbar with the given length and format
 * @param  {Number} total  Length of the progress bar
 * @param  {Object} format Format for the ProgressBar (see pushFormat and pullFormat)
 * @return {Object}        ProgressBar
 */
var progressStart = function progressStart(total, format) {
  return new ProgressBar(format, progressBarOptions(total + 1));
};

/**
 * Returns a function that ticks the given progressbar with the given file info
 * @param  {Object} bar   ProgressBar to tick
 * @return {Function}     Object -> Void
 */
var progressTick = function progressTick(bar) {
  return function (file) {
    if (file.failed) {
      bar.total -= 1;
    } else {
      bar.tick({
        file: file.filename || file.title
      });
    }
  };
};

/**
 * Final tick for the given progressbar
 * @param  {Object} bar   ProgressBar to tick
 * @return {Function}     Object -> Void
 */
var progressEnd = function progressEnd(bar) {
  return function (count, verb) {
    return bar.tick({
      file: 'Successfully ' + verb + ' ' + count + ' file' + (count > 1 ? 's' : '')
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
    if (!Kit.config.configExists(options)) {
      showError('Config not found.');
      Kit.config.create(options);
    }
    showNotice('Creating config and adding site', site.name ? site.name + ' (' + site.host + ')' : site.host);
    Kit.sites.add(Object.assign({}, site, { path: process.cwd() }), options);
  }
};

var showError = _.flow(chalk.red, console.log);
var showNotice = _.flow(chalk.white, console.log);

var fileName = function fileName(file) {
  if (_.has(file, 'layout_name')) {
    // layout or component
    return (file.component ? 'components' : 'layouts') + '/' + file.title;
  } else {
    // stylesheet, script file, image or asset
    var folder = void 0;
    if (file.asset_type !== 'unknown') {
      folder = file.asset_type + 's';
    } else {
      folder = 'assets';
    }
    return folder + '/' + file.filename;
  }
};

var handleError = function handleError(error) {
  if (!error || !error.code) {
    showError(error);
  }

  switch (error.code) {
    case 'ECONNREFUSED':
    case 'ECONNRESET':
      showError('Connection failed. Check your host and protocol settings.');
      break;
    default:
      showError('Something went wrong: ' + error.message);
  }
};

var unknown_command = "Unknown command!";
var no_project_found = "No project found in current directory!";
var pulling_from = "Pulling files from";
var pulling_file_from = "Pulling %FILE% from";
var pushing_to = "Pushing files to";
var pushing_file_to = "Pushing %FILE% to";
var created_files = "Created %COUNT% new file";
var removed_files = "Removed %COUNT% file";
var watcher_ready = "Initial scan complete. Ready for changes";
var specify_filename = "Please specify filename!";
var messages = {
	unknown_command: unknown_command,
	no_project_found: no_project_found,
	pulling_from: pulling_from,
	pulling_file_from: pulling_file_from,
	pushing_to: pushing_to,
	pushing_file_to: pushing_file_to,
	created_files: created_files,
	removed_files: removed_files,
	watcher_ready: watcher_ready,
	specify_filename: specify_filename
};

var helpText = '\nPull - pulls files from the Voog site\n\nUsage\n  $ ' + name + ' pull [<files>]\n\n  Using pull without arguments pulls all layout files from your site.\n';

var pullAllFiles = function pullAllFiles(project, options) {
  var projectName = project.name || project.host;
  // setting progress bar length to 0 at first because we don't know how many files there are before pulling
  var bar = progressStart(0, progressBarFormat$1);

  return Kit.actions.pullAllFiles(projectName, options).then(function (promises) {
    var files = _.head(promises);
    bar.total = files.length + 1; // set progress bar length based on number of files found
    return files;
  }).each(progressTick(bar)) // bump the progress bar as each promise resolves
  .then(function (files) {
    // separate invalid files from resolved files
    return files.reduce(function (acc, file) {
      if (!file.failed) {
        return Object.assign({}, { rejected: acc.rejected, resolved: acc.resolved.concat(file) });
      } else {
        return Object.assign({}, { rejected: acc.rejected.concat(file), resolved: acc.resolved });
      }
    }, { rejected: [], resolved: [] });
  }).then(function (_ref) {
    var rejected = _ref.rejected;
    var resolved = _ref.resolved;

    if (resolved.length > 0) {
      // show final message on the progress bar
      progressEnd(bar)(resolved.length, 'pulled');
    }

    if (rejected.length > 0) {
      // show invalid files
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var pullFiles = function pullFiles(project, files, options) {
  // initialize progress bar with length of files given as arguments
  var bar = progressStart(files.length, progressBarFormat$1);
  var projectName = project.name || project.host;

  Promise.each(files.map(function (file) {
    return Kit.actions.pullFile(projectName, file, options);
  }),
  // bump the progress bar as each promise resolves
  progressTick(bar)).then(function (files) {
    // separate invalid files from resolved files
    return files.reduce(function (acc, file) {
      if (!file.failed) {
        return Object.assign({}, { rejected: acc.rejected, resolved: acc.resolved.concat(file) });
      } else {
        return Object.assign({}, { rejected: acc.rejected.concat(file), resolved: acc.resolved });
      }
    }, { rejected: [], resolved: [] });
  }).then(function (_ref2) {
    var rejected = _ref2.rejected;
    var resolved = _ref2.resolved;

    if (resolved.length > 0) {
      // show final message on the progress bar
      showNotice('Successfully pulled ' + resolved.length + ' file' + (resolved.length > 1 ? 's' : '') + ':');
      showNotice(resolved.map(function (f) {
        return '  ' + fileName(f);
      }).join('\n'));
    }

    if (rejected.length > 0) {
      // show invalid files
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var pull = function pull(args, options) {
  var files = args;
  var currentProject = getCurrentProject(options);

  if (!currentProject) {
    showNotice(messages.no_project_found);
  } else {
    var project = currentProject;
    var projectName = project.name ? project.name + ' (' + project.host + ')' : project.host;

    showNotice(messages.pulling_from, projectName);

    if (files.length === 0) {
      pullAllFiles(project, options);
    } else {
      pullFiles(project, files, options);
    }
  }
};

var helpText$1 = '\nPush - pushes files to the Voog site\n\nUsage\n  $ ' + name + ' push [<files>]\n\n  Using push without arguments pushes all layout files to your site\n';

var pushAllFiles = function pushAllFiles(project, options) {
  var projectName = project.name || project.host;
  // initialize progress bar with number of local files
  var bar = progressStart(Kit.sites.totalFilesFor(projectName, options), progressBarFormat);

  return Kit.actions.pushAllFiles(projectName, options).then(function (promises) {
    return _.head(promises);
  }).each(progressTick(bar)) // bump progress bar as each promise resolves
  .then(function (files) {
    // separate invalid files from resolved files
    return files.reduce(function (acc, file) {
      if (!file.failed) {
        return Object.assign({}, { rejected: acc.rejected, resolved: acc.resolved.concat(file) });
      } else {
        return Object.assign({}, { rejected: acc.rejected.concat(file), resolved: acc.resolved });
      }
    }, { rejected: [], resolved: [] });
  }).then(function (_ref) {
    var rejected = _ref.rejected;
    var resolved = _ref.resolved;

    if (resolved.length > 0) {
      // show final message on the progress bar
      progressEnd(bar)(resolved.length, 'pushed');
    }

    if (rejected.length > 0) {
      // show invalid files
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var pushFiles = function pushFiles(project, files, options) {
  // initialize progress bar with length of files given as arguments
  var projectName = project.name || project.host;

  Promise.all(files.map(function (file) {
    return Kit.actions.pushFile(projectName, file, options);
  })).then(function (files) {
    // separate invalid files from resolved files
    return files.reduce(function (acc, file) {
      if (!file.failed) {
        return Object.assign({}, { rejected: acc.rejected, resolved: acc.resolved.concat(file) });
      } else {
        return Object.assign({}, { rejected: acc.rejected.concat(file), resolved: acc.resolved });
      }
    }, { rejected: [], resolved: [] });
  }).then(function (_ref2) {
    var rejected = _ref2.rejected;
    var resolved = _ref2.resolved;

    if (resolved.length > 0) {
      showNotice('Successfully pushed ' + resolved.length + ' file' + (resolved.length > 1 ? 's' : '') + ':');
      showNotice(resolved.map(function (f) {
        return '  ' + fileName(f);
      }).join('\n'));
    }

    if (rejected.length > 0) {
      // show invalid files
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var push = function push(args, options) {
  var files = args;
  var currentProject = getCurrentProject(options);

  if (!currentProject) {
    showNotice(messages.no_project_found);
  } else {
    var project = currentProject;
    var projectName = project.name ? project.name + ' (' + project.host + ')' : project.host;

    showNotice(messages.pushing_to, projectName);

    if (files.length === 0) {
      pushAllFiles(project, options);
    } else {
      pushFiles(project, files, options);
    }
  }
};

var helpText$2 = '\nAdd - creates a new file and adds it to the site\n\nUsage\n  $ ' + name + ' name <filename>\n';

var addFiles = function addFiles(project, files) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  Promise.map(files, function (file) {
    return Kit.actions.addFile(project.name || project.host, file, options);
  }).then(function (files) {
    return files.reduce(function (acc, file) {
      if (file.failed) {
        return { resolved: acc.resolved, rejected: acc.rejected.concat(file) };
      } else {
        return { resolved: acc.resolved.concat(file), rejected: acc.rejected };
      }
    }, { resolved: [], rejected: [] });
  }).then(function (_ref) {
    var resolved = _ref.resolved;
    var rejected = _ref.rejected;

    if (resolved.length) {
      showNotice(messages.created_files.replace(/%COUNT%/g, resolved.length) + ((resolved.length > 1 ? 's' : '') + ':'));
      showNotice(resolved.map(function (f) {
        return '  ' + fileName(f);
      }).join('\n'));
    }

    if (rejected.length > 0) {
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var add = function add(args, options) {
  var files = args;
  var currentProject = getCurrentProject(options);

  if (!currentProject) {
    showError(messages.no_project_found);
  } else if (files.length === 0) {
    showError(messages.specify_filename);
  } else {
    addFiles(currentProject, files, options);
  }
};

var helpText$3 = '\nRemove - removes a file, both locally and from the site\n\nUsage\n  $ ' + name + ' remove <filename>\n';

var removeFiles = function removeFiles(project, files) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  Promise.map(files, function (file) {
    return Kit.actions.removeFile(project.name || project.host, file, options);
  }).then(function (files) {
    return files.reduce(function (acc, file) {
      if (file.failed) {
        return { resolved: acc.resolved, rejected: acc.rejected.concat(file) };
      } else {
        return { resolved: acc.resolved.concat(file), rejected: acc.rejected };
      }
    }, { resolved: [], rejected: [] });
  }).then(function (_ref) {
    var resolved = _ref.resolved;
    var rejected = _ref.rejected;

    if (resolved.length) {
      showNotice(messages.removed_files.replace(/%COUNT%/g, resolved.length) + ((resolved.length > 1 ? 's' : '') + ':'));
      showNotice(resolved.map(function (f) {
        return '  ' + fileName(f);
      }).join('\n'));
    }

    if (rejected.length > 0) {
      showError('There were some errors:\n' + rejected.map(function (f) {
        return '  ' + f.file + ' (' + f.message + ')';
      }).join('\n'));
    }
  }).catch(handleError);
};

var remove = function remove(args, options) {
  var files = args;
  var currentProject = getCurrentProject(options);

  if (!currentProject) {
    console.log(messages.no_project_found);
  } else if (files.length === 0) {
    console.log(messages.specify_filename);
  } else {
    removeFiles(currentProject, files, options);
  }
};

var helpText$4 = '\nSites - lists all sites defined in the current scope\n\nUsage\n  $ ' + name + ' sites\n';

var siteRow = function siteRow(name, options) {
  var currentProject = getCurrentProject(options);

  var host = Kit.sites.hostFor(name);
  var current = '';

  if (!currentProject) {
    current = '';
  } else {
    current = name === currentProject.name || name == currentProject.host ? ' [current]' : '';
  }

  return '  ' + name + ' (' + host + ')' + current;
};

var sites = function sites(args, options) {
  var names = Kit.sites.names();
  showNotice('Sites:\n' + names.map(_.curryRight(siteRow, options)).join('\n') + '\n');
};

var helpText$5 = '\nWatch - watches the current folder and adds/updates/removes files on the site\n\nUsage\n  $ ' + name + ' watch\n';

var ready = false;
var onReady = function onReady() {
  showNotice(watcher_ready);
  ready = true;
};

var onAdd = function onAdd(project, path) {
  if (ready) {
    showNotice('File ' + path + ' has been added');
    addFiles(project, [path]);
  }
};

var onChange = function onChange(project, path) {
  showNotice('File ' + path + ' has been changed');
  pushFiles(project, [path]);
};

var onRemove = function onRemove(project, path) {
  showNotice('File ' + path + ' has been removed');
  removeFiles(project, [path]);
};

var watch = function watch(args, options) {
  var currentProject = getCurrentProject(options);

  if (!currentProject) {
    showError(no_project_found);
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
  help: '\n' + name + ' is a command-line tool to synchronize Voog layout files.\n\nUsage\n  $ ' + name + ' <command> [<args] [--debug]\n\nCommands\n  pull [<files>]    Pull files\n  push [<files>]    Push files\n  watch             Watch for changes\n  add [<files>]     Add files\n  remove [<files>]  Remove files\n  sites             List all sites\n\n  help <command>    Show help for a specific command\n\nOptions\n  --host            Site\'s hostname\n  --token           Your personal API token\n  --protocol        Explicit protocol (http/https)\n  --overwrite       Enable overwriting layout assets on save (images, icons etc.)\n  --debug           Show debugging output\n',
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

updateConfig({
  host: cli.flags.host,
  token: cli.flags.token,
  protocol: cli.flags.protocol || 'http',
  overwrite: cli.flags.overwrite || false,
  name: cli.flags.name || cli.flags.host
}, {
  config_path: cli.flags.configPath,
  local: true
});

var _cli$input = babelHelpers.toArray(cli.input);

var command = _cli$input[0];

var args = _cli$input.slice(1);

var options = _.pick(cli.flags, 'host', 'token', 'name', 'protocol', 'overwrite', 'debug');

if (Object.keys(commands).indexOf(command) >= 0 && !(command === 'help' && args.length === 0)) {
  try {
    commands[command](args, options);
  } catch (e) {
    showError(e.message);

    if (options.debug) {
      console.log(e.stack);
    }
  }
} else {
  cli.showHelp();
}

if (options.debug) {
  printDebugInfo(command, args, cli);
}