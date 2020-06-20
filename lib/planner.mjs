import { Job, Queue, Loop } from '../index.mjs'
import lodashGet from 'lodash.get'

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

  getLoopClass (plan) {
    const planner = this
    if (plan.type === 'job' && plan.invoke) {
      const fn = this._getServiceFunction(plan)
      return class LoopJob extends Job {
        constructor (options) {
          super(plan)
          if (plan.onFail) {
            this.onFail = planner.toModel(plan.onFail)
          }
        }

        fn (...args) {
          return fn(...args)
        }
      }
    } else if (plan.type === 'job' && plan.fn) {
      // if (plan.onFail) {
      //   plan.onFail = this.toModel(plan.onFail)
      // }
      // return new Job(plan)
    } else if (plan.type === 'queue' && plan.queue) {
      return class LoopQueue extends Queue {
        constructor (options) {
          super(options)
          for (const item of plan.queue) {
            this.add(planner.toModel(item))
          }
        }
      }
    } else {
      const err = new Error('invalid plan item type: ' + plan.type)
      err.plan = plan
      throw err
    }
  }

  toModel (plan) {
    plan = Object.assign({}, plan)
    if (plan.type === 'job' && plan.invoke) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      plan.fn = this._getServiceFunction(plan)
      // if (plan.args) {
      //   plan.argsFn = function () {
      //     return arrayify(plan.args).map(arg => this._replaceScopeToken(arg))
      //   }
      // }
      return new Job(plan)
    } else if (plan.type === 'job' && plan.fn) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      return new Job(plan)
    } else if (plan.type === 'queue' && plan.queue) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail)
      }
      if (plan.onSuccess) {
        plan.onSuccess = this.toModel(plan.onSuccess)
      }
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
      const loop = new Loop(plan)
      if (plan.for) {
        loop.for = () => {
          const ofFn = lodashGet(this.ctx, plan.for.of)
          if (!ofFn) {
            throw new Error('of not found: ' + plan.for.of)
          }
          return {
            var: plan.for.var,
            of: typeof ofFn === 'function' ? ofFn() : ofFn
          }
        }
      }
      loop.Node = this.getLoopClass(plan.node)
      if (plan.args) loop.args = this.ctx[plan.args]
      if (plan.argsFn) loop.argsFn = this.ctx[plan.argsFn]
      return loop
    } else {
      const err = new Error('invalid plan item type: ' + plan.type)
      err.plan = plan
      throw err
    }
  }
}

export default Planner
