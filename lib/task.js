'use strict'
const arrayify = require('array-back')
const StateMachine = require('fsm-base')
const defer = require('defer-promise')

/**
 * A task defines a piece of work which needs doing now, or in the future. When you create a task you receive a promise for its result. Process the task using `task.process()`.
 * @extends {module:state-machine}
 * @alias module:work.Task
 */
class Task extends StateMachine {

  /**
   * @param {function | function[]} - the resolver function
   * @param [options] {object} - an object containing optional values
   * @param [options.name] {string} - a name string, useful for debugging
   * @param [options.data] {object} - data used by the resolver function
   */
  constructor (executor, options) {
    super({
      state: Task.eState.PENDING,
      validMoves: [
        { from: Task.eState.PENDING, to: Task.eState.RUNNING },
        { from: Task.eState.RUNNING, to: Task.eState.REJECTED },
        { from: Task.eState.RUNNING, to: Task.eState.FULFILLED },
        { from: [ Task.eState.REJECTED, Task.eState.FULFILLED ], to: Task.eState.RESOLVED },
        { from: [ Task.eState.PENDING, Task.eState.RUNNING ], to: Task.eState.CANCELLED }
      ]
    })

    options = options || {}
    if (!options.data) options.data = {}

    /**
     * This deferred should is passed to the resolver function when the task is processed.
     * @readonly
     * @private
     */
    this._deferred = defer()

    /**
     * a promise for the completion of the task
     * @type {external:Promise}
     */
    this.promise = this._deferred.promise
    /**
     * One or more functions to resolve the deferred. Each resolver function will be passed the deferred, which it must either resolve or reject.
     * @type {function|function[]}
     */
    if (executor) this.executor = executor
    /**
     * useful for debug output
     * @type {string}
     */
    this.name = options.name
    /**
     * data for the task
     * @type {string}
     */
    this.context = options.context

    /* define what should happen on resolution or rejection of promise  */
    this.promise
      .then(() => {
        if (this.state !== Task.eState.CANCELLED) {
          /**
           * Emitted when a task fulfills
           * @event module:work.Task#fulfilled
           */
          this._setState(Task.eState.FULFILLED)

          /**
           * Emitted when a task is resolved
           * @event module:work.Task#resolved
           */
          process.nextTick(() => {
            this._setState(Task.eState.RESOLVED)
          })
        }
      })
      .catch(err => {
        /**
         * Emitted when a task is rejected
         * @event module:work.Task#rejected
         * @param {Error} - the rejection reason
         */
        this._setState(Task.eState.REJECTED, err)
        process.nextTick(() => {
          this._setState(Task.eState.RESOLVED)
        })
      })
  }

  /**
   * Process the task - settled the deferred using the supplied resolver function(s). The resolver function is called in the context of the task and receives a `deferred`, which must be resolved.
   */
  process () {
    if (this.state !== Task.eState.RUNNING) {
      /**
       * Emitted when a task starts
       * @event module:work.Task#running
       */
      this._setState(Task.eState.RUNNING)

      /* attempt to settle the deferred using the supplied resolver functions */
      arrayify(this.executor).forEach((executor) => {
        try {
          executor.call(this, this._deferred.resolve, this._deferred.reject)
        } catch (err) {
          this._deferred.reject(err)
        }
      })
    }
  }

  /**
   * a cancelled task fulfils with the value -1
   */
  cancel () {
    this._setState(Task.eState.CANCELLED)
    this._deferred.resolve(-1)
  }

}

/**
 * The various Task states.
 * @enum {string}
 */
Task.eState = {
  PENDING: 'pending',
  RUNNING: 'running',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
}

module.exports = Task
