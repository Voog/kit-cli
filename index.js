'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var meow = _interopDefault(require('meow'));
var chalk = require('chalk');

var babelHelpers = {};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers;

var bin = { "kit2": "index.js" };

var name$3 = Object.keys(bin)[0];

var helpText$1 = '\nTest - Test command please ignore\n\nUsage\n  $ ' + name$3 + ' test [<args>] [--<flags>]\n';

var test = function test(args, flags) {
  console.log('\n\nI am a test command.\nARGS: ' + args + '\nFLAGS: ' + flags + '\n\n  ');
};

var name$2 = Object.keys(bin)[0];

var helpText = '\nHelp - Shows help about the tool or a particular command\n\nUsage\n  $ ' + name$2 + ' help [<args>]\n';

var help = function help(command) {
  switch (command) {
    case 'test':
      console.log(helpText$1);
      break;
    case 'help':
      console.log(helpText);
      break;
    default:
      console.log('\nUnknown command!\n      ');
      break;
  }
};

var name = Object.keys(bin)[0];

var cli = meow({
  help: '\n' + name + ' is a command-line tool to synchronize Voog layout files.\n\nUsage\n  $ ' + name + ' <command> [<args] [--debug]\n\nCommands\n  help              Show this message\n  help <command>    Show help for a specific command\n\nOptions\n  --debug           Show debugging output\n',
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

switch (command) {
  case 'help':
    if (args.length) {
      help(args[0]);
    } else {
      cli.showHelp();
    }
    break;

  case 'test':
    test(args, flags);
    break;

  default:
    cli.showHelp();
    break;
}