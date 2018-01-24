'use strict'
const EventEmitter = require('events').EventEmitter
const Task = require('./task')

/**
 * Command queue.
 * @alias module:work.Queue
 */

class Queue extends EventEmitter {
  /**
   * @param [options] {object}
   * @param [options.maxConcurrent=1] {number}
   * @param [options.name] {string} - useful for debugging
   */
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
    this.todo = []

    /**
    The in-progress tasks
    @type {Array}
    */
    this.active = []

    /**
    The in-progress tasks
    @type {Array}
    */
    this.done = []

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
  @type {number}
  */
  get freeSlotCount () {
    return this.maxConcurrent - this.active.length
  }

  /**
   * add a task to the queue
   * @param {module:work.Task} - task instance
   * @chainable
   */
  add (command) {

  }

  /**
   *
   */
  next () {
  }

  /**
   * process the queue - attempt to resolve each task.
   */
  process () {
  }

  cancel () {
  }

  /**
   * Test whether any tasks are queued or active
   * @return boolean
   */
  isEmpty () {
    return this.queued.length === 0 && this.active.length === 0
  }
}

module.exports = Queue
