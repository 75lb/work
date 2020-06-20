import Node from './node.mjs'
import arrayify from 'array-back/index.mjs'

class Job extends Node {
  constructor (options = {}) {
    super(options)
    if (options.fn) {
      this.fn = options.fn
    }
    if (options.result) {
      /**
       * Write result to this scope key.
       */
      this.result = options.result
    }
    this.id = (Math.random() * 10e20).toString(16)
    this.type = 'job'
  }

  async _process (...processArgs) {
    const args = this._getArgs(processArgs)
    return this.fn(...args)
  }

  add (node) {
    super.add(node)
    this.emit('add', node)
  }
}

export default Job
