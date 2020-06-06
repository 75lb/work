import { Queue, Job } from '../index.mjs'

class Loop extends Queue {
  constructor (options) {
    super(options)
    this.type = 'loop'
    this.forEach = options && options.forEach
  }

  async process () {
    const iterable = this.forEach()
    for (const i of iterable) {
      const job = new Job()
      job.name = 'loop'
      job.fn = this.fn
      job.args = this.args.slice().map(arg => {
        if (arg === '${i}') {
          return i
        } else {
          return arg.replace('${i}', i)
        }
      })
      this.add(job)
    }
    return super.process()
  }
}

export default Loop
