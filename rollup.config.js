import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import cli from 'rollup-plugin-cli';

export default {
  entry: 'src/kit.js',
  format: 'cjs',
  sourceMap: false,
  plugins: [
    json(),
    cli(),
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: [
    'meow',
    'chalk',
    'fs',
    'kit-core',
    'path',
    'bluebird',
    'progress',
    'chokidar',
    'lodash',
    'inquirer'
  ],
  dest: './index.js'
};
