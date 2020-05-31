import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'
import arrayify from 'array-back/index.mjs'

class Job extends mixInto(CompositeClass)(StateMachine) {
  constructor (options = {}) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      { from: 'failed', to: 'complete' },
      { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' },
    ])
    if (options.fn) {
      this.fn = options.fn
    }
    if (options.onFail) {
      this.onFail = options.onFail
    }
    this.name = options.name
    this.args = options.args
    this.result
  }

  async process () {
    try {
      this.setState('in-progress', this)
      const result = await this.fn(...arrayify(this.args))
      this.setState('successful', this)
      return result
    } catch (err) {
      this.setState('failed', this)
      if (this.onFail) {
        if (!(this.onFail.args && this.onFail.args.length)) {
          this.onFail.args = [err, this]
        }
        return this.onFail.process()
      } else {
        throw err
      }
    } finally {
      this.setState('complete', this)
    }
  }
}

export default Job
