var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util"),
    Job = require("./job");

// event definitions
/**
@event info
@param String message
*/
/**
@event warning
@param String message
*/
/**
@event error
@param String message
*/
/**
@event starting
@param {Timer} timer
@param {QueueStats} stats
*/
/**
@event complete
@param {Timer} timer
*/
/**
@event job-starting
@param {Timer} timer
*/
/**
@event job-progress
@param {Progress} progress
*/
/**
@event job-complete
@param {Timer} timer
*/
/**
@event terminated
*/

/**
@class Queue
@module work
@constructor
*/
function Queue(){
    var _jobs = [];
    var self = this;
    
    this.timer = null;
    
    this.add = function(job){
        if (typeof job === "string"){
            job = new Job(job);
            _jobs.push(job);
            return job;
        } else {
            _jobs.push(job);
            return this;
        }
    };
    
    Object.defineProperty(this, "jobs", { enumerable: true, configurable: true, get: getJobs });
    function getJobs(){
        return _jobs.map(function(job){ return job.name; });
    }
    
    this.start = function(){
        
        function runJob(){
            var job = _jobs.shift();
            if (job){
                job.on("starting", function(name, timer){ self.emit("job-starting", name, timer); })
                    .on("progress", function(name, prog){ self.emit("job-progress", name, prog); })
                    .on("complete", function(name, timer){
                        self.emit("job-complete", name, timer);
                        if (_jobs.every(function(job){ return job.complete; })){
                            self.timer.stop();
                            self.emit("complete", self.timer);
                        }
                    })
                   .on("info", function(msg){ self.emit("info", msg); })
                   .on("warning", function(msg){ self.emit("warning", msg); })
                   .on("error", function(err){ self.emit("error", err); })
                   .on("terminated", function(){ self.emit("terminated"); })
                   .run();

               if (job.async){
                   runJob();
               } else {
                   job.on("complete", function(){ runJob(); })
                      .on("error", function(){ runJob(); })
                      .on("terminated", function(){ runJob(); });
               }
            }
        }
        
        this.timer = new Timer().start();
        self.emit("starting", this.timer);
        runJob();
    };
}
Queue.prototype = new EventEmitter();

module.exports = Queue;