import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'
import arrayify from 'array-back/index.mjs'

class Job extends mixInto(CompositeClass)(StateMachine) {
  constructor (fn, options = {}) {
    super()
    if (!fn) {
      throw new Error('Job function required')
    }
    this.fn = fn
    this.name = options.name
    this.args = arrayify(options.args)
    this.onFail = options.onFail
    this.onSuccess = options.onSuccess
  }

  async process () {
    try {
      const result = await this.fn(...this.args)
      return result
    } catch (err) {
      if (this.onFail) {
        return this.onFail.process()
      } else {
        throw err
      }
    }
  }
}

export default Job
