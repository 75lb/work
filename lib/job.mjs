import Node from './node.mjs'
import arrayify from 'array-back/index.mjs'

class Job extends Node {
  constructor (options = {}) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      { from: 'failed', to: 'complete' },
      { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' },
    ])
    if (options.fn) {
      this.fn = options.fn
    }
    if (options.onFail) {
      this.onFail = options.onFail
    }
    if (options.onSuccess) {
      this.onSuccess = options.onSuccess
    }
    this.id = (Math.random() * 10e18).toString(16)
    this.type = 'job'
    this.name = options.name
    this.args = options.args
  }

  async process (...args) {
    try {
      this.setState('in-progress', this)
      const result = await this.fn(...(args.length ? args : arrayify(this.args)))
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

  toString () {
    return `${this.name || this.invoke || this.fn.name}: ${this.state}`
  }

  tree () {
    return Array.from(this).reduce((prev, curr) => {
      const indent = '  '.repeat(curr.level())
      const line = `${indent}- ${curr}\n`
      return (prev += line)
    }, '')
  }
}

export default Job
