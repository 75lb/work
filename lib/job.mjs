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
    this.fn = options.fn
    this.name = options.name
    this.args = options.args
    this.onFail = options.onFail
    this.result
  }

  async process () {
    try {
      this.state = 'in-progress'
      const result = await this.fn(...arrayify(this.args))
      this.state = 'successful'
      return result
    } catch (err) {
      this.state = 'failed'
      if (this.onFail) {
        if (!(this.onFail.args && this.onFail.args.length)) {
          this.onFail.args = [err, this]
        }
        return this.onFail.process()
      } else {
        throw err
      }
    } finally {
      this.state = 'complete'
    }
  }
}

export default Job
