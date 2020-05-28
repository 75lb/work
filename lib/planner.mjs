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
      const fn = this.services[plan.service || 'default'][plan.invoke]
      if (fn) {
        const node = new Job(fn, plan)
        return node
      } else {
        throw new Error('Could not find function: ' + plan.invoke)
      }
    } else if (plan.type === 'job' && plan.fn) {
      const node = new Job(plan.fn, plan)
      return node
    } else if (plan.type = 'queue' && plan.queue) {
      const queue = new Queue(plan)
      for (const item of plan.queue) {
        if (item.type === 'template' && item.template) {
          for (const i of item.repeatForEach()) {
            // TODO: insert in place, rather than appending to end of queue
            const node = this.toModel(item.template(i))
            queue.add(node)
          }
        } else {
          const node = this.toModel(item)
          queue.add(node)
        }
      }
      return queue
    } else {
      const err = new Error('invalid plan item type: ' + plan.type)
      err.plan = plan
      throw err
    }
  }
}

export default Planner
