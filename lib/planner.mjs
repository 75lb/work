import { Work, Job, Queue } from '../index.mjs'

class Planner {
  constructor () {
    this.services = {}
    this.root
  }

  addService (service, name) {
    this.services[name || 'default'] = service
  }

  toModel (plan) {
    if (plan.type === 'job' && plan.invoke) {
      const fn = this.services.default[plan.invoke]
      const node = new Job(fn, plan)
      return node
    } else if (plan.type === 'job' && plan.fn) {
      const node = new Job(plan.fn, plan)
      return node
    } else if (plan.type = 'queue' && plan.queue) {
      const queue = new Queue()
      for (const item of plan.queue) {
        const node = this.toModel(item)
        queue.add(node)
      }
      return queue
    }
  }
}

export default Planner
