import {bin} from '../../package.json';
let name = Object.keys(bin)[0];

const helpText = `
Test - Test command please ignore

Usage
  $ ${name} test [<args>] [--<flags>]
`;

const test = (args, flags) => {
  console.log(`

I am a test command.
ARGS: ${args}
FLAGS: ${flags}

  `);
};

export default test;
export {helpText};
