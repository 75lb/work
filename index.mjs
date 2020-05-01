import Emitter from 'obso/index.mjs'
const _maxConcurrency = new WeakMap()

class Queue extends Emitter {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super()
    options = Object.assign({
      jobs: [],
      maxConcurrency: 10,
      skipAfter: false
    }, options)
    this.jobs = []
    this.jobStats = {
      total: 0,
      complete: 0,
      active: 0
    }
    this.maxConcurrency = options.maxConcurrency
    /**
     * Store arbitrary data here.
     */
    this.data = null
    this.result = null
    for (const job of options.jobs) {
      this.add(job)
    }

    //TODO .addAfter method which incrememts jobStats.total
    if (!options.skipAfter) {
      this.after = new Queue({ maxConcurrency: options.maxConcurrency, skipAfter: true })
    }
  }

  get maxConcurrency () {
    return _maxConcurrency.get(this)
  }
  set maxConcurrency (val) {
    if (!Number.isInteger(val)) {
      throw 'You must supply an integer to queue.maxConcurrency'
    }
    _maxConcurrency.set(this, val)
  }

  add (job) {
    this.jobs.push(job)
    this.jobStats.total++
  }

  /**
   * Iterate over `jobs` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  async * [Symbol.asyncIterator] () {
    while (this.jobs.length) {
      const slotsAvailable = this.maxConcurrency - this.jobStats.active
      if (slotsAvailable > 0) {
        const toRun = []
        for (let i = 0; i < slotsAvailable; i++) {
          const job = this.jobs.shift()
          if (job) {
            this.jobStats.active++
            this.emit('job-start')
            const jobPromise = job().then(result => {
              this.jobStats.active -= 1
              this.jobStats.complete += 1
              this.emit('job-end')
              return result
            })
            toRun.push(jobPromise)
          }
        }
        const results = await Promise.all(toRun)
        for (const result of results) {
          yield result
        }
      }
    }
    if (this.after) {
      yield * this.after
    }
  }

  async process () {
    const output = []
    for await (const result of this) {
      output.push(result)
    }
    return output
  }
}

export default Queue
