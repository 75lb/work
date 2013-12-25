"use strict";
var util = require("util"),
    Thing = require("nature").Thing,
    _Job = require("./_Job");

var eEvent = {
    start: "start",
    complete: "complete"
};

var Queue = module.exports = function Queue(parent){
    this.throwOnInvalid = true;
    this.define({ name: "allComplete", type: "boolean" })
        .define({ name: "jobs", type: Array, default: [] })
        .define({ name: "parent", type: _Job, default: parent });
}
util.inherits(Queue, Thing);

Queue.prototype.add = function(job){
    this.jobs.push(job);
};

Queue.prototype.start = function(){
    var self = this;
    function shouldRunChild(state, runOn){
        return (
            (state === "successful" && runOn === "success") ||
            (state === "successful" && runOn === "complete") ||
            (state === "failed" && runOn === "fail") ||
            (state === "failed" && runOn === "complete")
        );
    }

    this.jobs.forEach(function(job){
        if (shouldRunChild(self.parent.state, job.runOn)) {
            job.run();
        } else {
            job.ignore();
        }
    });
};
