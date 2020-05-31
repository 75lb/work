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
}

export default Work
