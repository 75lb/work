import Node from './node.mjs'

const _maxConcurrency = new WeakMap()

class Queue extends Node {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super(options)
    options = Object.assign({
      jobs: [],
      maxConcurrency: 1
    }, options)
    this.jobStats = {
      total: 0,
      complete: 0,
      active: 0
    }
    this.id = (Math.random() * 10e18).toString(16)
    this.maxConcurrency = options.maxConcurrency
    this.type = 'queue'
    for (const job of options.jobs) {
      this.add(job)
    }
  }

  get maxConcurrency () {
    return _maxConcurrency.get(this)
  }

  set maxConcurrency (val) {
    if (!Number.isInteger(val)) {
      throw new Error('You must supply an integer to queue.maxConcurrency')
    }
    _maxConcurrency.set(this, val)
  }

  add (job) {
    super.add(job)
    this.jobStats.total++
    this.emit('add', job)
  }

  /**
   * Iterate over `jobs` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  async * [Symbol.asyncIterator] () {
    this.setState('in-progress', this)
    const jobs = this.children.slice()
    try {
      while (jobs.length) {
        const slotsAvailable = this.maxConcurrency - this.jobStats.active
        if (slotsAvailable > 0) {
          const toRun = []
          for (let i = 0; i < slotsAvailable; i++) {
            const job = jobs.shift()
            if (job) {
              this.jobStats.active++
              const jobPromise = job.process()
                .then(result => {
                  this.jobStats.active -= 1
                  this.jobStats.complete += 1
                  return result
                })
              toRun.push(jobPromise)
            }
          }
          const completedJobs = await Promise.all(toRun)
          for (const job of completedJobs) {
            yield job
          }
        }
      }
      if (this.onSuccess) {
        this.add(this.onSuccess)
        await this.onSuccess.process()
      }
      this.setState('successful', this)
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

  async _process () {
    const output = []
    for await (const result of this) {
      output.push(result)
    }
    return output
  }
}

export default Queue
