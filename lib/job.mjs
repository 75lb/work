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
    try {
      this.setState('in-progress', this)
      const args = this._getArgs(processArgs)
      const result = await this.fn(...args)
      if (this.result) {
        this.scope.set(this.result, result)
      }
      this.setState('successful', this)
      if (this.onSuccess) {
        if (!(this.onSuccess.args && this.onSuccess.args.length)) {
          this.onSuccess.args = [result, this]
        }
        this.add(this.onSuccess)
        await this.onSuccess.process()
      }
      return result
    } catch (err) {
      this.setState('failed', this)
      if (this.onFail) {
        if (!(this.onFail.args && this.onFail.args.length)) {
          this.onFail.args = [err, this]
        }
        this.add(this.onFail)
        await this.onFail.process()
      } else {
        throw err
      }
    }
  }

  add (node) {
    super.add(node)
    this.emit('add', node)
  }
}

export default Job
