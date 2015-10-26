'use strict'
require('promise.prototype.finally');
var Queue = require('./queue')
var Task = require('./task')

/**
 * A first-in-first-out async task queue. Fill the queue with {@link module:work.Task} instances  * (using {@link module:work.TaskQueue#push}) then (when ready) call {@link  * module:work.TaskQueue#process} to settle each task in the order they were received. During  * processing, the queue will process {@link module:work.TaskQueue#maxConcurrent} tasks at a time.  * Each task comprises a name, [deferred](https://github.com/kriskowal/q/wiki/API-Reference#qdefer) and  l ist  *of resolvers - each of which will race to settle the deferred first.
 *
 * @module work
 * @typicalname tq
 * @example
 * var tq = require("work")
 * var q = require("q")
 * var http = require("http")
 *
 * var queue = new tq.TaskQueue()
 *
 * // get the football results - it will take between 0 and 2000ms
 * // and resolve with the result
 * function resultResolver(deferred){
 * 	setTimeout(function(){
 * 		deferred.resolve("West Ham 1 - Tottenham Hotspur 3")
 * 	}, Math.random() * 2000)
 * }
 *
 * // but the timeout resolver will reject it after 1000ms
 * function timeoutResolver(deferred){
 * 	setTimeout(function(){
 * 		deferred.reject(Error("timeout"))
 * 	}, 1000)
 * }
 *
 * var task = new tq.Task({
 * 	name: "get result",
 * 	resolver: [ resultResolver, timeoutResolver ]
 * })
 *
 * queue.push(task)
 *
 * task.deferred.promise
 * 	.then(function(result){
 * 		console.log(result)
 * 	})
 * 	.catch(function(err){
 * 		console.log("It failed: " + err.message)
 * 	})
 *
 * queue.process()
 */
exports.Queue = Queue
exports.Task = Task

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Promise rejection:');
    console.error(reason.stack)
})
