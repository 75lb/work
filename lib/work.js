'use strict'
var Queue = require('./queue')
var Task = require('./task')
var Command = require('./command')
var CommandQueue = require('./command-queue')

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
