"use strict";
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var View = require("../view/view");
var fs = require("fs");
var Task = require("./task");

module.exports = Queue;

/**
@class
@classdesc queue class for processing promises
@alias module:work.Queue
@param [options] {object}
@param [options.maxConcurrent=1] {number}
@param [options.name] {string} - useful for debugging
*/
function Queue(options){
	options = options || {};
	var queue = [];
	var self = this;

	/**
	a count of the tasks currently being process
	@private
	*/
	this._inProgress = 0;

	/**
	useful for debugging
	@type {string}
	*/
	this.name = options.name;

	/**
	the current task queue
	@type {Array}
	*/
	this.queue = queue;

	/**
	The in-progress tasks
	@type {Array}
	*/
	this.active = [];

	/**
	when emptying, specifying the max number of tasks which may run simultaneously.
	@type {number}
	@default 1
	*/
	this.maxConcurrent = options.maxConcurrent || 1;

	/**
	queue length
	@type {number}
	*/
	this.length = 0;
}
util.inherits(Queue, EventEmitter);

/**
add a task to the queue
@param {module:work.Job} - task instance
@returns {module:work.Job}
*/
Queue.prototype.push = function(task){
	if (!(task instanceof Task)) throw Error("must pass a Task instance to .push()");
	var self = this;
	
	this.queue.push(task);
	this.length = this.queue.length;
	if (this.length === 1){
		/**
		Emitted at the moment a queue becomes occupied (has at least 1 task)
		@event module:work.Queue#occupied
		*/
		this.emit("occupied");
	}
	/**
	Emitted when a task is added
	@event module:work.Queue#push
	@param {module:work.Job} - the task that was pushed
	*/
	this.emit("push", task);
	return task;
};

/**
returns the next task in the queue and adds it to the `active` list. 
@returns {module:work.Job}
*/
Queue.prototype.shift = function(){
	if (this.queue.length){
		var task = this.queue.shift();
		this.length = this.queue.length;
		if (this.queue.length === 0){
			/**
			Emitted after the final task is taken off the queue for processing
			@event module:work.Queue#empty
			*/
			this.emit("empty");
		}
		/**
		Emitted when a task is shifted
		@event module:work.Queue#shift
		@param {module:work.Job} - the task that was pushed
		*/
		this.emit("shift", task);
		return task;
	}
};

/**
place a view in the DOM under the specified parent element
@param {Element} - the parent element under which to place the view
@return {QueueView}
*/
Queue.prototype.view = function(parentEl){
	var self = this;
	var queueView = View(
		fs.readFileSync(__dirname + "/../view/queue/view.hbs", "utf8"),
		{
			viewModel: {
				name: this.name,
				maxConcurrent: this.maxConcurrent,
				_inProgress: function(){ return self._inProgress; },
				queue: function(){ return self.length; },
				active: function(){ return self.active.length; }
			},
			model: this,
			parentEl: parentEl,
			events: ["push", "shift", "empty", "complete"],
			css: fs.readFileSync(__dirname + "/../view/queue/view.css", "utf8"),
			name: "queueView"
		}
	);

	var activeList = View(
		fs.readFileSync(__dirname + "/../view/task-list/view.hbs", "utf8"),
		{
			viewModel: {
				name: "active",
				list: this.active
			},
			model: this,
			events: ["push", "shift", "empty", "complete"],
			css: fs.readFileSync(__dirname + "/../view/task-list/view.css", "utf8"),
			name: "activeList"
		}
	);

	var queueList = View(
		fs.readFileSync(__dirname + "/../view/task-list/view.hbs", "utf8"),
		{
			viewModel: {
				name: "queue",
				list: this.queue
			},
			model: this,
			events: ["push", "shift", "empty", "complete"],
			css: fs.readFileSync(__dirname + "/../view/task-list/view.css", "utf8"),
			name: "queueList"
		}
	);
};

/**
Define a schedule for processing the queue.
@param {function} - the schedule function to execute.. called in the context of this queue instance.
*/
Queue.prototype.setSchedule = function(schedule){
	schedule.call(this);
};

/**
Clears the schedule set by {@link module:work#setSchedule}.
@todo refactor
*/
Queue.prototype.clearSchedule = function(){
	clearInterval(this._processInterval);
};

/**
process the queue - attempt to resolve each task.
*/
Queue.prototype.process = function(){
	var self = this;
	var freeSlotCount = this.maxConcurrent - this._inProgress;
	if (this.length && freeSlotCount > 0){
		for (var i = 0; i < freeSlotCount; i++){
			var task = this.shift();
			if (!task) continue;

			/* behaviour after the task resolves/rejects */
			task.promise
				.then(function(){
					self._inProgress--;
					self.active.splice(self.active.indexOf(task), 1);
					if (self.length){
						self.process();
					} else if (!self.length && !self._inProgress) {
						/**
						Emitted when the queue processing is complete
						@event module:work.Queue#complete
						*/
						self.emit("complete");
					}
				})
				.catch(function(err){
					self._inProgress--;
					self.active.splice(self.active.indexOf(task), 1);
				})
				.done();

			this._inProgress++;
			this.active.push(task);
			task.process();
		}
	}
};
