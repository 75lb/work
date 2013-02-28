var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util");

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
function Queue(options){
    var _jobs = [];
    var self = this;
    
    this.timer = null;
    this.name = options.name;
    this.complete = false;
    
    Object.defineProperty(this, "state", { enumerable: true, configurable: true, get: function(){
        return JSON.stringify({
            name: this.name,
            jobs: {
                total: _jobs.length
            }
        });
    }});
    
    this.add = function(job){
        // console.log("JOB");
        // console.log(Job.name);
        if (job instanceof Job){
            _jobs.push(job);
            return this;
        } else {
            _jobs.push(new Job(job));
            return this;
        }
    };
    
    Object.defineProperty(this, "jobs", { enumerable: true, configurable: true, get: getJobs });
    function getJobs(){
        return _jobs.map(function(job){ return job; });
    }
    
    this.start = function(){
        self.emitStarting();
        
        function runJob(){
            var job = _jobs.shift();
            if (job){
               job.on("queue-starting", function(state){ self.emitStarting(state); })
                   .on("queue-complete", function(state){ self.emitComplete(state); })
                   .on("job-starting", function(state){ self.emit("job-starting", state); })
                   .on("job-progress", function(state, progress){ self.emit("job-progress", state, progress); })
                   .on("job-complete", function(state){ 
                       self.emit("job-complete", state); 
                       if (!self.complete){
                           if (_jobs.every(function(job){ return job.complete; })){
                               self.emitComplete();
                           }
                       }
                   })
                   .on("job-success", function(state){ self.emit("job-success", state); })
                   .on("job-fail", function(state){ self.emit("job-fail", state); })
                   .on("job-info", function(state, msg){ self.emit("job-info", state, msg); })
                   .on("job-warning", function(state, msg){ self.emit("job-warning", state, msg); })
                   .on("job-error", function(state, err){ self.emit("job-error", state, err); })
                   .on("job-terminated", function(state){ self.emit("job-terminated", state); });

               if (job.async){
                   runJob();
               } else {
                   job.on("job-complete", function(){ runJob(); });
               }
               
               job.run();
            }
        }
        
        runJob();
    };
}
Queue.prototype = new EventEmitter();

Queue.prototype.emitStarting = function(state){
    this.timer = new Timer().start();
    this.emit("queue-starting", state || this.state); 
};
Queue.prototype.emitComplete = function(state){
    this.timer.stop();
    this.complete = true;
    this.emit("queue-complete", state || this.state); 
};

Queue.prototype.print = function(){
    this.jobs.forEach(function(job){
        console.log(job.name);
        job.onSuccess.jobs.forEach(function(job){
            console.log("   " + job.name);
        });
        job.onFail.jobs.forEach(function(job){
            console.log("   " + job.name);
        });
    });
}
module.exports = Queue;

// Queue needed to be fully defined before loading Job, which depends on Queue
var Job = require("./job");
