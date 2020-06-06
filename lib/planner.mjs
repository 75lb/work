import { Work, Job, Queue, Loop } from '../index.mjs'

class Planner {
  constructor (ctx) {
    this.services = { default: {} }
    this.ctx = ctx
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

  _getServiceFunction (plan) {
    const service = this.services[plan.service || 'default']
    const fn = service[plan.invoke]
    if (fn) {
      return fn.bind(service)
    } else {
      throw new Error('Could not find function: ' + plan.invoke)
    }
  }

  toNodeClass (plan) {
    if (plan.type === 'job' && plan.invoke) {
      const fn = this._getServiceFunction(plan)
      return class Node extends Job {
        constructor (options) {
          super(options)
          if (plan.onFail) {
            this.onFail = this.toModel(plan.onFail)
          }
        }

        fn (...args) {
          return fn(...args)
        }
      }
    } else if (plan.type === 'job' && plan.fn) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      return new Job(plan)
    } else if (plan.type === 'queue' && plan.queue) {
      const queue = new Queue(plan)
      for (const item of plan.queue) {
        queue.add(this.toModel(item))
      }
      return queue
    } else if (plan.type === 'template' && plan.template) {
      const queue = new Queue(plan)
      const items = Array.isArray(plan.repeatForEach)
        ? plan.repeatForEach
        : plan.repeatForEach()
      for (const i of items) {
        // TODO: insert in place, rather than appending to end of queue
        const node = this.toModel(plan.template(i))
        queue.add(node)
      }
      return queue
    } else if (plan.type === 'loop') {
    } else {
      const err = new Error('invalid plan item type: ' + plan.type)
      err.plan = plan
      throw err
    }
  }

  toModel (plan) {
    if (plan.type === 'job' && plan.invoke) {
      const fn = this._getServiceFunction(plan)
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      plan.fn = fn
      return new Job(plan)
    } else if (plan.type === 'job' && plan.fn) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      return new Job(plan)
    } else if (plan.type === 'queue' && plan.queue) {
      const queue = new Queue(plan)
      for (const item of plan.queue) {
        queue.add(this.toModel(item))
      }
      return queue
    } else if (plan.type === 'template' && plan.template) {
      const queue = new Queue(plan)
      const items = Array.isArray(plan.repeatForEach)
        ? plan.repeatForEach
        : plan.repeatForEach()
      for (const i of items) {
        // TODO: insert in place, rather than appending to end of queue
        const node = this.toModel(plan.template(i))
        queue.add(node)
      }
      return queue
    } else if (plan.type === 'loop') {
      const loop = new Loop()
      loop.forEach = () => this.ctx[plan.forEach]
      loop.Node = this.toNodeClass(plan.node)
      loop.args = this.ctx[plan.args]
      return loop
    } else {
      const err = new Error('invalid plan item type: ' + plan.type)
      err.plan = plan
      throw err
    }
  }
}

export default Planner
