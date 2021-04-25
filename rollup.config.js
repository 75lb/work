const resolve = require('rollup-plugin-node-resolve')
const commonJs = require('@rollup/plugin-commonjs')

module.exports = [
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.mjs',
      format: 'esm'
    },
    external: [],
    plugins: [resolve({ preferBuiltins: true }), commonJs()]
  }
]
