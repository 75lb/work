import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'

const _maxConcurrency = new WeakMap()

class Queue extends mixInto(CompositeClass)(StateMachine) {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      { from: 'failed', to: 'complete' },
      { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' },
    ])
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
    this.name = options.name
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
    this.state = 'in-progress'
    const jobs = this.children.slice()
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
                job.result = result
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
    this.state = 'successful'
  }

  async process () {
    const output = []
    for await (const result of this) {
      output.push(result)
    }
    return output
  }

  toString () {
    return `${this.name || 'queue'}: ${this.state}`
  }

  tree () {
    return Array.from(this).reduce((prev, curr) => {
      const indent = '  '.repeat(curr.level())
      const line = `${indent}- ${curr}\n`
      return (prev += line)
    }, '')
  }
}

export default Queue
