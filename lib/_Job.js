"use strict";
var util = require("util"),
    Thing = require("nature").Thing,
    Queue = require("./Queue"),
    l = console.log;

var eState = {
    idle: "idle",
    running: "running",
    successful: "successful",
    failed: "failed",
    ignored: "ignored"
};

var eEvent = {
    start: "start",
    success: "success",
    fail: "fail",
    complete: "complete",
    ignore: "ignore"
};

var _Job = module.exports = function _Job(options){
    var self = this;
    this.throwOnInvalid = true;
    this.define({ name: "name", type: "string" })
        .define({ name: "command", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "state", type: "string", valueTest: /^(idle|running|successful|failed|ignored)$/, default: "idle" })
        .define({ name: "isComplete", type: "boolean" })
        .define({ name: "runOn", type: "string", valueTest: /^(start|fail|success|complete)$/, default: "complete" })
        .define({ name: "returnValue" })
        .define({ name: "error", type: Error })
        .define({ name: "children", type: Queue, default: new Queue(this) })
        .set(options);

    this.on(eEvent.complete, function(){
        self.isComplete = true;
        self.children.start();
    });
};
util.inherits(_Job, Thing);

_Job.prototype.eState = eState;
_Job.prototype.eEvent = eEvent;

_Job.prototype.success = function(returnValue){
    this.state = eState.successful;
    this.returnValue = returnValue;
    this.emit(eEvent.success);
    this.emit(eEvent.complete);
};

_Job.prototype.fail = function(err){
    this.state = eState.failed;
    this.error = err;
    this.emit(eEvent.fail);
    this.emit(eEvent.complete);
};

_Job.prototype.ignore = function(){
    this.state = eState.ignored;
    this.emit(eEvent.ignore);
    this.emit(eEvent.complete);
};

_Job.prototype.add = function(job){
    this.children.add(job);
};
