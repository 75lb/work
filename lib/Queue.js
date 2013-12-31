"use strict";
var util = require("util"),
    Thing = require("nature").Thing;

var eEvent = {
    start: "start",
    complete: "complete"
};

var Queue = module.exports = function Queue(parent){
    this.throwOnInvalid = true;
    this.define({ name: "allComplete", type: "boolean" })
        .define({ name: "jobs", type: Array, default: [] })
        .define({ name: "parent", default: parent });
}
util.inherits(Queue, Thing);

Queue.prototype.add = function(job){
    this.jobs.push(job);
};

Queue.prototype.start = function(){
    var queue = this, job;
    function shouldRunChild(state, runOn){
        return (
            (runOn === "success" && state === "successful" ) ||
            (runOn === "fail" && state === "failed" ) ||
            (runOn === "complete" && state === "successful") ||
            (runOn === "complete" && state === "failed")
        );
    }
    
    
    // function iterate(){
    //     
    // }
    while(job = queue.jobs.shift()){
        if (job instanceof AsyncJob)
    }

    queue.jobs.forEach(function(job){
        job.on("complete", function(){
            if (queue.jobs.every(function(job){ return job.isComplete; })){
                queue.emit("complete");
            }
        });
        if (queue.parent){
            if (shouldRunChild(queue.parent.state, job.runOn)) {
                job.run();
            } else {
                job.ignore();
            }
        } else {
            job.run();
        }
    });
};
