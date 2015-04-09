"use strict";
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var a = require("array-tools");
var View = require("../view/view");
var fs = require("fs");
var q = require("q");

module.exports = Job;

/**
@class
@classdesc A task defines a piece of work which needs doing now, or in the future. When you create a task you receive a promise for its result.
Process the task using `task.process()`.
@param {function | function[]} - the resolver function
@param [options] {object} - an object containing optional values
@param [options.name] {string} - a name string, useful for debugging
@param [options.data] {object} - data used by the resolver function
@alias module:work.Job
*/
function Job(resolver, options){
	var self = this;
	/**
	This deferred should is passed to the resolver function when the task is processed.
	@readonly
	@private
	*/
	this._deferred = new q.defer();

	/**
	a promise for the completion of the task
	@type {external:Promise}
	*/
	this.promise = this._deferred.promise;
	/**
	One or more functions to resolve the deferred. Each resolver function will be passed the deferred, which it must either resolve or reject.
	@type {function|function[]}
	*/
	this.resolver = resolver;
	/**
	useful for debug output
	@type {string}
	*/
	this.name = options.name;
	/**
	data for the task
	@type {string}
	*/
	this.data = options.data || {};
	
	/* define what should happen on resolution or rejection of promise  */
	this.promise
		.then(function(){
			/**
			Emitted when a task resolves
			@event module:work.Job#resolved
			*/
			self.emit("resolved");
			/**
			Emitted when a task is settled
			@event module:work.Job#settled
			*/
			self.emit("settled");
		})
		.catch(function(err){
			/**
			Emitted when a task is rejected
			@event module:work.Job#rejected
			@param {Error} - the rejection reason
			*/
			self.emit("rejected", err);
			self.emit("settled");
		})
		.done();
}
util.inherits(Job, EventEmitter);

/**
Process the task - settled the deferred using the supplied resolver function(s)
*/
Job.prototype.process = function(){
	var self = this;
	/**
	Emitted when a task starts
	@event module:work.Job#starting
	*/
	this.emit("starting");
	
	/* attempt to settle the deferred using the supplied resolver functions */
	a.arrayify(this.resolver).forEach(function(resolver){
		resolver.call(self, self._deferred);
	});
};

Job.prototype.view = function(){
	var taskView = new View(
		fs.readFileSync(__dirname + "/../view/task/view.hbs", "utf8"),
		{
			viewModel: this,
			model: this,
			events: ["starting", "push", "settled", "shift", "empty"],
			css: fs.readFileSync(__dirname + "/../view/task/view.css", "utf8")
		}
	);
};
