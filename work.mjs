import Emitter from 'obso/index.mjs'
import Queue from './queue.mjs'
import t from 'typical/index.mjs'

class Work extends Emitter {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super()
    this.name = 'Work'
    this.data = undefined
    this.strategy = {}
    this.jobs = {}
  }

  async process (node) {
    node = node || this.strategy
    if ('condition' in node && !node.condition) {
      return
    }
    node = Object.assign({
      maxConcurrency: 1,
      args: []
    }, node)
    if (node.jobs) {
      if (node.maxConcurrency === 1) {
        if (Array.isArray(node.jobs)) {
          for (const job of node.jobs) {
            await this.process(job)
          }
        } else if (t.isPlainObject(node.jobs)) {
          let firstJob
          for (const name of Object.keys(node.jobs)) {
            if (node.jobs[name].first) {
              firstJob = node.jobs[name]
              firstJob.name = name
              break
            }
          }
          firstJob.parentJobs = node.jobs
          await this.process(firstJob)
        } else {
          throw new Error('invalid jobs type')
        }
      } else {
        const queue = new Queue({ maxConcurrency: node.maxConcurrency })
        for (const job of node.jobs) {
          queue.add(async () => {
            await this.process(job)
          })
        }
        await queue.process()
      }
    } else {
      const jobFn = this.jobs[node.name]
      try {
        // console.log('TRY', node.name, ...node.args)
        await jobFn(...node.args)
        if (node.parentJobs && node.success) {
          const job = node.parentJobs[node.success]
          job.name = node.success
          job.parentJobs = node.parentJobs
          await this.process(job)
        }
      } catch (err) {
        // console.log('ERR', node.name, ...node.args, err.message)
        if (node.parentJobs && node.fail) {
          const job = node.parentJobs[node.fail]
          job.name = node.fail
          job.parentJobs = node.parentJobs
          await this.process(job)
        } else {
          throw err
        }
      } finally {
        // console.log('FIN', node.name, ...node.args)
        if (node.parentJobs && node.next) {
          const job = node.parentJobs[node.next]
          job.name = node.next
          job.parentJobs = node.parentJobs
          await this.process(job)
        }
      }
    }
  }
}

export default Work
