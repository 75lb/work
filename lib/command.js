const arrayify = require('array-back')
const StateMachine = require('fsm-base')
const defer = require('defer-promise')

/**
 * A task defines a piece of work which needs doing now, or in the future. When you create a task you receive a promise for its result. Process the task using `task.process()`.
 * @alias module:work.Command
 */
class Command extends StateMachine {

  /**
   * @param {function | function[]} - the resolver function
   * @param [options] {object} - an object containing optional values
   * @param [options.name] {string} - a name string, useful for debugging
   * @param [options.data] {object} - data used by the resolver function
   */
  constructor (executor, options) {
    if (!executor) throw new Error('executor required')
    options = Object.assign({ data: {}, context: {} }, options)
    super([
      { from: undefined, to: Command.eState.PENDING },
      { from: Command.eState.PENDING, to: Command.eState.RUNNING },
      { from: Command.eState.RUNNING, to: Command.eState.REJECTED },
      { from: Command.eState.RUNNING, to: Command.eState.FULFILLED },
      { from: [ Command.eState.REJECTED, Command.eState.FULFILLED ], to: Command.eState.RESOLVED },
      { from: [ Command.eState.PENDING, Command.eState.RUNNING ], to: Command.eState.CANCELLED }
    ])
    this.state = Command.eState.PENDING
    this._deferred = defer()

    /**
     * a promise for the completion of the task
     * @type {external:Promise}
     */
    this.promise = this._deferred.promise

    /**
     * One or more executor functions, the first one to fulfil/reject will resolve the command.
     * @type {function|function[]}
     */
    this.executor = executor

    /**
     * useful for debug output
     * @type {string}
     */
    this.name = options.name

    /**
     * A namespace to expose state used by the execute() method.
     * @type {object}
     */
    this.context = options.context

    /* define what should happen on resolution or rejection of promise  */
    this.promise
      .then(() => {
        if (this.state !== Command.eState.CANCELLED) {
          /**
           * Emitted when a task fulfills
           * @event module:work.Command#fulfilled
           */
          this.state = Command.eState.FULFILLED

          /**
           * Emitted when a task is resolved
           * @event module:work.Command#resolved
           */
          setTimeout(() => {
            this.state = Command.eState.RESOLVED
          }, 0)
        }
      })
      .catch(err => {
        /**
         * Emitted when a task is rejected
         * @event module:work.Command#rejected
         * @param {Error} - the rejection reason
         */
        this.state = Command.eState.REJECTED
        setTimeout(() => {
          this.state = Command.eState.RESOLVED
        }, 0)
      })
  }

  /**
   * Settle the deferred using the supplied resolver function(s). The resolver function is called in the context of the task.
   */
  async execute () {
    if (this.state !== Command.eState.PENDING) {
      throw new Error('Can only execute in "pending" state')
    } else {
      /**
       * Emitted when a task starts
       * @event module:work.Command#running
       */
      this.state = Command.eState.RUNNING

      // setTimeout(() => {
        arrayify(this.executor).forEach((executor) => {
          try {
            executor.call(this, this._deferred.resolve, this._deferred.reject)
          } catch (err) {
            this._deferred.reject(err)
          }
        })
      // })
      return this._deferred.promise
    }
  }

  /**
   * a cancelled task fulfils with the value -1
   */
  cancel () {
    this.state = Command.eState.CANCELLED
    this._deferred.resolve(-1)
  }

}

/**
 * The various Command states.
 * @enum {string}
 */
Command.eState = {
  PENDING: 'pending',
  RUNNING: 'running',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
}

module.exports = Command
