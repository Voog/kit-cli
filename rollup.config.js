import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/kit.js',
  format: 'cjs',
  sourceMap: false,
  plugins: [
    json(),
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
    'progress'
  ],
  dest: './index.js'
};
