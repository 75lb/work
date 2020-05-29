import { Work, Job, Queue } from '../index.mjs'

class Planner {
  constructor () {
    this.services = { default: {} }
    this.root
  }

  addService (service, name) {
    const existingService = this.services[name || 'default']
    if (existingService) {
      Object.assign(existingService, service)
    } else {
      this.services[name || 'default'] = service
    }
  }

  toModel (plan) {
    if (plan.type === 'job' && plan.invoke) {
      const fn = this.services[plan.service || 'default'][plan.invoke]
      if (fn) {
        if (plan.onFail) {
          plan.onFail = this.toModel(plan.onFail)
        }
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
          const items = Array.isArray(item.repeatForEach)
            ? item.repeatForEach
            : item.repeatForEach()
          for (const i of items) {
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
