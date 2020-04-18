const _maxConcurrency = new WeakMap()

class Queue {
  /**
   * @param {function[]} jobs - An array of functions, each of which must return a Promise.
   * @param {number} maxConcurrency
   */
  constructor (jobs, maxConcurrency, skipAfter) {
    this.jobs = []
    this.jobStats = {
      total: 0,
      complete: 0,
      active: 0
    }
    this.maxConcurrency = maxConcurrency || 10
    /**
     * Store arbitrary data here.
     */
    this.data = null
    this.result = null
    for (const job of jobs) {
      this.add(job)
    }

    if (!skipAfter) this.after = new Queue([], maxConcurrency, true)
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
    const output = []
    while (this.jobs.length) {
      const slotsAvailable = this.maxConcurrency - this.jobStats.active
      if (slotsAvailable > 0) {
        const toRun = []
        for (let i = 0; i < slotsAvailable; i++) {
          const job = this.jobs.shift()
          if (job) {
            toRun.push(job())
            this.jobStats.active++
          }
        }
        const results = await Promise.all(toRun)
        this.jobStats.active -= results.length
        this.jobStats.complete += results.length
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
    while (this.jobs.length) {
      const slotsAvailable = this.maxConcurrency - this.jobStats.active
      if (slotsAvailable > 0) {
        const toRun = []
        for (let i = 0; i < slotsAvailable; i++) {
          const job = this.jobs.shift()
          if (job) {
            toRun.push(job())
            this.jobStats.active++
          }
        }
        const results = await Promise.all(toRun)
        this.jobStats.active -= results.length
        output.push(...results)
      }
    }
    return output
  }
}

export default Queue
