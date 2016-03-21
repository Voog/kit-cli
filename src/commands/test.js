import {name} from '../utils';

const helpText = `
Test - Test command please ignore

Usage
  $ ${name} test [<args>] [--<flags>]
`;

const test = (args, flags) => {
  console.log(`
I am a test command.
  `);
};

export default test
export {
  helpText
}
