import Emitter from 'obso/index.mjs'
import Queue from './queue.mjs'
import Planner from './planner.mjs'

class Work extends Emitter {
  /**
   * @param {object} options
   */
  constructor (options) {
    super()
    this.name = 'Work'
    this.ctx = undefined // proxy, monitor read and writes via traps
    this.plan = {}
    this.planner = new Planner()
  }

  addService (...args) {
    this.planner.addService(...args)
  }

  setPlan (plan) {
    this.model = this.planner.toModel(plan)
  }

  async process () {
    return this.model.process()
  }

  createContext () {
    const work = this
    return new Proxy({}, {
      get: function (target, prop, receiver) {
        work.emit('ctx-read', prop, target[prop])
        return Reflect.get(...arguments)
      },
      set: function (target, prop, value, receiver) {
        work.emit('ctx-write', prop, value)
        return Reflect.set(...arguments)
      }
    })
  }
}

export default Work
