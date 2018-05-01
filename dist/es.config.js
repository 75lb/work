import builtins from 'rollup-plugin-node-builtins'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'index.js',
  output: {
    file: 'dist/es.js',
    format: 'es'
  },
  plugins: [
    builtins(),
    nodeResolve(),
    commonjs()
  ]
}
