/** ⏏ Job
 * Module exporting the Job class.
 */
import Node from './node.mjs'

/** ♺ Job ⇐ Node
 * Define a job to run later.
 */
class Job extends Node {
  constructor (options = {}) {
    super(options)
    if (options.fn) {
      /** ▪︎ job.fn
       * The command to execute. Required.
       */
      this.fn = options.fn
    }
    if (options.result) {
      /** ▪︎ job.result
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
}

export default Job
