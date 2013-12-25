"use strict";
var util = require("util"),
    Thing = require("nature").Thing,
    l = console.log;

var eState = {
    idle: "idle",
    running: "running",
    successful: "successful",
    failed: "failed"
};

var eEvent = {
    start: "start",
    success: "success",
    fail: "fail",
    complete: "complete"
};

function shouldRunChild(job, child){
    return (
        (job.state === eState.successful && child.runOn === eEvent.success) ||
        (job.state === eState.successful && child.runOn === eEvent.complete) ||
        (job.state === eState.failed && child.runOn === eEvent.fail) ||
        (job.state === eState.failed && child.runOn === eEvent.complete)
    );
}

var _Job = module.exports = function _Job(options){
    this.define({ name: "name", type: "string" })
        .define({ name: "command", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "state", type: "string", valueTest: /^(idle|running|successful|failed)$/, default: "idle" })
        .define({ name: "children", type: Array, default: [] })
        .define({ name: "runOn", type: "string", valueTest: /^(start|complete)$/, default: "complete" })
        .set(options);

    this.on(eEvent.complete, function(){
        var self = this;
        this.children.forEach(function(child){
            if (shouldRunChild(self, child)) child.run();
        });
    });
};
util.inherits(_Job, Thing);

_Job.prototype.eState = eState;
_Job.prototype.eEvent = eEvent;

_Job.prototype.success = function(){
    this.state = eState.successful;
    this.emit(eEvent.success);
    this.emit(eEvent.complete);
};

_Job.prototype.fail = function(){
    this.state = eState.failed;
    this.emit(eEvent.fail);
    this.emit(eEvent.complete);
};

_Job.prototype.add = function(job){
    this.children.push(job);
};
