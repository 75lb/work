import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'
import arrayify from 'array-back/index.mjs'

class Job extends mixInto(CompositeClass)(StateMachine) {
  constructor (fn, options = {}) {
    super()
    this.fn = fn
    this.name = options.name
    this.args = arrayify(options.args)
    this.onFailQueue = options.onFailQueue
    this.onSuccessQueue = options.onSuccessQueue
  }

  async process () {
    return this.fn(...this.args)
  }
}

export default Job
