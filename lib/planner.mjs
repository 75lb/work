import { Work, Job, Queue } from '../index.mjs'

class Planner {
  constructor () {
    this.services = { default: {} }
  }

  addService (...args) {
    const [name, service] = args.length === 1
      ? ['default', args[0]]
      : args
    const existingService = this.services[name]
    if (existingService) {
      Object.assign(existingService, service)
    } else {
      this.services[name] = service
    }
  }

  toModel (plan) {
    if (plan.type === 'job' && plan.invoke) {
      const service = this.services[plan.service || 'default']
      const fn = service[plan.invoke]
      if (fn) {
        if (plan.onFail) {
          plan.onFail = this.toModel(plan.onFail)
        }
        plan.fn = fn.bind(service)
        return new Job(plan)
      } else {
        throw new Error('Could not find function: ' + plan.invoke)
      }
    } else if (plan.type === 'job' && plan.fn) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      const node = new Job(plan)
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
