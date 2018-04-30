'use strict'
const Queue = require('./lib/queue')
const Task = require('./lib/task')
const Command = require('./lib/command')
const CommandQueue = require('./lib/command-queue')

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
