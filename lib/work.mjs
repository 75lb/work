import Emitter from 'obso/index.mjs'
import Planner from './planner.mjs'

class Work extends Emitter {
  /**
   * @param {object} options
   */
  constructor (options) {
    super()
    this.name = 'Work'
    this.ctx = undefined // proxy, monitor read and writes via traps
    this.planner = new Planner()
    /**
     * Required model to process.
     */
    this.model = null
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
    const ctx = new Proxy({}, {
      get: function (target, prop) {
        work.emit('ctx-read', prop, target[prop])
        return Reflect.get(...arguments)
      },
      set: function (target, prop, value) {
        work.emit('ctx-write', prop, value)
        return Reflect.set(...arguments)
      }
    })
    this.planner.ctx = ctx
    return ctx
  }
}

export default Work
