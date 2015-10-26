'use strict'
var EventEmitter = require('events').EventEmitter
var Task = require('./task')

/**
 * @class
 * @classdesc queue class for processing promises
 * @alias module:work.Queue
 * @param [options] {object}
 * @param [options.maxConcurrent=1] {number}
 * @param [options.name] {string} - useful for debugging
 */

class Queue extends EventEmitter {
  constructor (options) {
    super()
    options = options || {}

    /**
    useful for debugging
    @type {string}
    */
    this.name = options.name

    /**
    the current task queue
    @type {Array}
    */
    this.queued = []

    /**
    The in-progress tasks
    @type {Array}
    */
    this.active = []

    /**
    when emptying, specifying the max number of tasks which may run simultaneously.
    @type {number}
    @default 1
    */
    this.maxConcurrent = options.maxConcurrent || 1
  }

  /**
  queue length
  @type {number}
  */
  get length () {
    return this.queued.length
  }

  /**
  add a task to the end of the queue
  @param {module:work.Task} - task instance
  @returns {module:work.Task}
  */
  push (task) {
    if (!(task instanceof Task)) throw Error('must pass a Task instance to .push()')
    // if (!task.promise.isPending()) throw Error('must pass a task with a pending promise')
    var self = this

    this.queued.push(task)
    if (this.length === 1) {
      /**
      Emitted at the moment a queue becomes occupied (has at least 1 task)
      @event module:work.Queue#occupied
      */
      this.emit('occupied')
    }
    /**
    Emitted when a task is added
    @event module:work.Queue#push
    @param {module:work.Task} - the task that was pushed
    */
    this.emit('push', task)
    return task
  }

  /**
  @type {number}
  */
  get freeSlotCount () {
    return this.maxConcurrent - this.active.length
  }

  /**
  returns the next task in the queue and adds it to the `active` list.
  @returns {module:work.Task}
  */
  shift () {
    if (this.length && this.freeSlotCount) {
      var task = this.queued.shift()
      if (this.length === 0) {
        /**
        Emitted after the final task is taken off the queue for processing
        @event module:work.Queue#empty
        */
        this.emit('empty')
      }

      /* remove task from active list once it resolves */
      task.promise
        .then(() => {
          asdfds
          /* active task must be deleted here, not in a `.finally()` handler which executes too late */
          this.active.splice(this.active.indexOf(task), 1)
          this.emit('active-change')
        })
        .catch(err => {
          /* active task must be deleted here, not in a `.finally()` handler which executes too late */
          this.active.splice(this.active.indexOf(task), 1)
          this.emit('active-change')
        })
        .finally(() => {
          if (!this.length && !this.active.length) {
            /**
            Emitted when the queue processing is complete
            @event module:work.Queue#complete
            */
            this.emit('complete')
          }
        })

      this.active.push(task)
      task.process()

      /**
      Emitted when a task is shifted
      @event module:work.Queue#shift
      @param {module:work.Task} - the task that was pushed
      */
      this.emit('shift', task)
      return task
    }
  }

  /**
  process the queue - attempt to resolve each task.
  */
  process () {
    var task = this.shift()

    if (task) {
      task.promise.finally(this.process.bind(this))
    }
  }

  /**
  insert a task at the front of the queue, returning the instance inserted
  @param {module:work.Task} - the task to be inserted
  @returns {module:work.Task}
  */
  unshift (newTask) {
    var task = newTask instanceof Task ? newTask : new Task(newTask)
    this.queued.unshift(task)
    if (this.length === 1) {
      /**
      Emitted at the moment a queue becomes occupied (has at least 1 task)
      @event module:work.Queue#occupied
      */
      this.emit('occupied')
    }
    /**
    Emitted when a task is unshifted to the front of the queue
    @event module:work.Queue#unshift
    @param {module:work.Task} - the task that was pushed
    */
    this.emit('unshift', task)
    return task
  }

  /**
  Shifts the next task off the queue and calls `.cancel()` on it
  @returns {module:work.Task}
  */
  cancel () {
    if (this.queued.length) {
      var task = this.queued.shift()
      if (this.queued.length === 0) {
        /**
        Emitted after the final task is taken off the queue for processing
        @event module:work.Queue#empty
        */
        this.emit('empty')
      }
      /**
      Emitted when a task is cancelled
      @event module:work.Queue#cancel
      @param {module:work.Task} - the task that was cancelled
      */
      this.emit('cancel', task)

      task.cancel()
      return task
    }
  }

  /**
  Test whether any tasks are queued or active
  @return boolean
  */
  isEmpty () {
    return this.queued.length === 0 && this.active.length === 0
  }
}

module.exports = Queue
