'use strict'
const Queue = require('./queue')
const Task = require('./task')
const Command = require('./command')
const CommandQueue = require('./command-queue')

/**
 * A Command class and Invoker queue class, both observable.
 *
 * @module work
 * @example
 */
exports.Queue = Queue
exports.Task = Task
exports.Command = Command
exports.CommandQueue = CommandQueue
